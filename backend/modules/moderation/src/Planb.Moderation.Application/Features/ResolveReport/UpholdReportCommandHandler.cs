using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Domain.Reports;
using Planb.Reviews.Application.IntegrationEvents;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>
/// Handler del uphold (US-051). Carga el report (404 si no existe), verifica que esté Open (409 si otro
/// moderador lo resolvió antes), cascadea a Upheld TODOS los reports open de la reseña (ADR-0011) con
/// la misma nota, persiste, y publica <see cref="ReviewRemovalRequestedIntegrationEvent"/> para que
/// Reviews remueva la reseña (+ audit) en su propio scope transaccional (outbox).
/// </summary>
public static class UpholdReportCommandHandler
{
    public static async Task<Result<ResolveReportResponse>> Handle(
        UpholdReportCommand command,
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

        // Cascade: todos los reports open de la reseña pasan a Upheld con la misma nota. EF trackea por
        // key, así que `report` es la misma instancia que la fila correspondiente de openReports.
        var openReports = await reports.GetOpenByReviewAsync(report.ReviewId, ct);
        foreach (var open in openReports)
        {
            var upheld = open.Uphold(command.ModeratorUserId, command.ResolutionNote, clock);
            if (upheld.IsFailure)
            {
                return upheld.Error;
            }
        }

        await unitOfWork.SaveChangesAsync(ct);

        await bus.PublishAsync(new ReviewRemovalRequestedIntegrationEvent(
            EventId: Guid.NewGuid(),
            ReviewId: report.ReviewId,
            ModeratorUserId: command.ModeratorUserId,
            ResolutionNote: report.ResolutionNote,
            OccurredAt: clock.UtcNow));

        var cascadedCount = Math.Max(0, openReports.Count - 1);
        return new ResolveReportResponse(
            report.Id.Value, ReviewReportStatus.Upheld.ToString(), cascadedCount);
    }
}
