using Microsoft.Extensions.Configuration;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Application.IntegrationEvents;
using Planb.Moderation.Domain.Reports;
using Planb.Reviews.Application.Contracts;
using Planb.Reviews.Application.IntegrationEvents;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Moderation.Application.Features.ReportReview;

/// <summary>
/// Handler for US-019 (report a review). Flow:
/// <list type="number">
///   <item>Rate limit the reporter (10/h, key <c>moderation:ratelimit:report:{userId}</c>).
///         Checked first so abusive bursts are throttled before any DB work.</item>
///   <item>Resolve the review's author via the Reviews contract. Null (missing/deleted) =&gt; 404.</item>
///   <item>Reject reporter == author =&gt; 403.</item>
///   <item>Reject a duplicate report by the same reporter =&gt; 409.</item>
///   <item>Create the report (details-length invariant =&gt; 400) and persist.</item>
///   <item>Count open reports. Always publish <see cref="ReviewReportedIntegrationEvent"/>;
///         if the count reached the configured threshold (ADR-0010), also publish
///         <see cref="ReviewQuarantineRequestedIntegrationEvent"/> so the Reviews context
///         hides the review.</item>
/// </list>
///
/// Threshold comes from config key <c>Moderation:AutoHideThreshold</c> (env var
/// <c>MODERATION__AUTO_HIDE_THRESHOLD</c>), default 3. Conservative default to avoid abuse
/// of collective auto-hide.
/// </summary>
public static class ReportReviewCommandHandler
{
    private const int DefaultThreshold = 3;
    private const int MaxReportsPerHour = 10;
    private static readonly TimeSpan RateWindow = TimeSpan.FromHours(1);

    public static async Task<Result<ReportReviewResponse>> Handle(
        ReportReviewCommand command,
        IReviewReportRepository reports,
        IModerationUnitOfWork unitOfWork,
        IReviewQueryService reviewQuery,
        IRateLimiter rateLimiter,
        IConfiguration configuration,
        IMessageBus bus,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // 1) Rate limit per reporter.
        var rate = await rateLimiter.TryAcquireAsync(
            $"moderation:ratelimit:report:{command.ReporterUserId}",
            RateWindow,
            MaxReportsPerHour,
            ct);
        if (!rate.Allowed)
        {
            return Result.Failure<ReportReviewResponse>(ReviewReportErrors.RateLimitExceeded);
        }

        // 2) Resolve author (cross-BC). Null means the review does not exist or was deleted.
        var authorUserId = await reviewQuery.GetAuthorUserIdAsync(command.ReviewId, ct);
        if (authorUserId is null)
        {
            return Result.Failure<ReportReviewResponse>(ReviewReportErrors.ReviewNotFound);
        }

        // 3) Cannot report your own review.
        if (authorUserId.Value == command.ReporterUserId)
        {
            return Result.Failure<ReportReviewResponse>(ReviewReportErrors.CannotReportOwnReview);
        }

        // 4) One report per reviewer per review.
        if (await reports.ExistsAsync(command.ReviewId, command.ReporterUserId, ct))
        {
            return Result.Failure<ReportReviewResponse>(ReviewReportErrors.AlreadyReported);
        }

        // 5) Create + persist.
        var reportResult = ReviewReport.Create(
            command.ReviewId,
            command.ReporterUserId,
            command.Reason,
            command.Details,
            clock);
        if (reportResult.IsFailure)
        {
            return Result.Failure<ReportReviewResponse>(reportResult.Error);
        }

        var report = reportResult.Value;
        reports.Add(report);
        await unitOfWork.SaveChangesAsync(ct);

        // 6) Threshold check + events.
        var openCount = await reports.CountOpenForReviewAsync(command.ReviewId, ct);
        var threshold = configuration.GetValue("Moderation:AutoHideThreshold", DefaultThreshold);
        var thresholdReached = openCount >= threshold;

        await bus.PublishAsync(new ReviewReportedIntegrationEvent(
            EventId: Guid.NewGuid(),
            ReportId: report.Id.Value,
            ReviewId: command.ReviewId,
            ReporterUserId: command.ReporterUserId,
            Reason: command.Reason.ToString(),
            OpenReportCount: openCount,
            OccurredAt: clock.UtcNow));

        if (thresholdReached)
        {
            await bus.PublishAsync(new ReviewQuarantineRequestedIntegrationEvent(
                EventId: Guid.NewGuid(),
                ReviewId: command.ReviewId,
                TriggeredByUserId: command.ReporterUserId,
                OpenReportCount: openCount,
                OccurredAt: clock.UtcNow));
        }

        return new ReportReviewResponse(report.Id.Value, thresholdReached);
    }
}
