using System.Text.Json;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Consumer de <see cref="ReviewRemovalRequestedIntegrationEvent"/> (US-051, uphold). Moderation
/// resolvió el/los report(s) y decidió remover la reseña; acá se aplica: una reseña Published o
/// UnderReview pasa a Removed y se escribe el audit log (action = ModeratorDecision). Idempotente: si
/// la reseña ya no está en un estado removible (ya Removed/Deleted), no-op sin escribir entry. Corre
/// en scope [Transactional] de Wolverine: cambio de estado + audit commitean atómico.
/// </summary>
public static class ReviewRemovalRequestedHandler
{
    public static async Task Handle(
        ReviewRemovalRequestedIntegrationEvent message,
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

        var removed = review.Remove(clock);
        if (!removed)
        {
            return;
        }

        var changesJson = JsonSerializer.Serialize(new
        {
            decision = "removed",
            note = message.ResolutionNote,
        });

        auditLog.Add(ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.ModeratorDecision,
            changesJson,
            message.ModeratorUserId,
            clock.UtcNow));

        await unitOfWork.SaveChangesAsync(ct);
    }
}
