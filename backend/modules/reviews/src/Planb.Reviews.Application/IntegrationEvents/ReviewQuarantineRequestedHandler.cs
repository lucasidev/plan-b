using System.Text.Json;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Consumer of <see cref="ReviewQuarantineRequestedIntegrationEvent"/> (US-019). This is
/// the first cross-module integration-event consumer in the codebase: Moderation publishes
/// the event to the Wolverine outbox; Wolverine routes it here because the Reviews
/// Application assembly is in the discovery set and this static <c>Handle</c> matches the
/// message type.
///
/// Applies the auto-hide: a Published review moves to UnderReview and an audit-log entry
/// (action = Reported) records why + who triggered it. If the review is no longer Published
/// (already hidden, removed, or deleted) the handler no-ops without writing an entry, so
/// duplicate or out-of-order deliveries are harmless.
///
/// The whole thing runs in a Wolverine [Transactional] scope, so the status change + audit
/// row commit atomically.
/// </summary>
public static class ReviewQuarantineRequestedHandler
{
    public static async Task Handle(
        ReviewQuarantineRequestedIntegrationEvent message,
        IReviewRepository reviews,
        IReviewAuditLogRepository auditLog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var review = await reviews.FindByIdAsync(new ReviewId(message.ReviewId), ct);
        if (review is null)
        {
            return;
        }

        var quarantined = review.QuarantineByReports(clock);
        if (!quarantined)
        {
            return;
        }

        var changesJson = JsonSerializer.Serialize(new
        {
            reason = "report_threshold_reached",
            openReportCount = message.OpenReportCount,
        });

        var entry = ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.Reported,
            changesJson,
            message.TriggeredByUserId,
            clock.UtcNow);
        auditLog.Add(entry);

        await unitOfWork.SaveChangesAsync(ct);
    }
}
