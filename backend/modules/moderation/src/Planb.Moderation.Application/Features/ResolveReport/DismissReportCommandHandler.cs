using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Domain.Reports;
using Planb.Reviews.Application.IntegrationEvents;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>
/// Handler del dismiss (US-051). Carga el report (404), verifica Open (409), lo desestima, persiste, y
/// si ya no quedan reports open en la reseña publica <see cref="ReviewReportsResolvedIntegrationEvent"/>
/// para que Reviews la restaure a Published SI estaba UnderReview (la decisión de estado la toma
/// Reviews, que la owns). No cascadea (el dismiss cierra solo este report).
/// </summary>
public static class DismissReportCommandHandler
{
    public static async Task<Result<ResolveReportResponse>> Handle(
        DismissReportCommand command,
        IReviewReportRepository reports,
        IModerationUnitOfWork unitOfWork,
        IMessageBus bus,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var report = await reports.FindByIdAsync(new ReviewReportId(command.ReportId), ct);
        if (report is null)
        {
            return ReviewReportErrors.ReportNotFound;
        }
        if (report.Status != ReviewReportStatus.Open)
        {
            return ReviewReportErrors.AlreadyResolved;
        }

        var dismissed = report.Dismiss(command.ModeratorUserId, command.ResolutionNote, clock);
        if (dismissed.IsFailure)
        {
            return dismissed.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        // Tras el flush, contamos los open restantes de la reseña. Si no quedan, avisamos a Reviews.
        var remainingOpen = await reports.CountOpenForReviewAsync(report.ReviewId, ct);
        if (remainingOpen == 0)
        {
            await bus.PublishAsync(new ReviewReportsResolvedIntegrationEvent(
                EventId: Guid.NewGuid(),
                ReviewId: report.ReviewId,
                ModeratorUserId: command.ModeratorUserId,
                OccurredAt: clock.UtcNow));
        }

        return new ResolveReportResponse(
            report.Id.Value, ReviewReportStatus.Dismissed.ToString(), 0);
    }
}
