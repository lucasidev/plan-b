using System.Text.Json;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Consumer de <see cref="ReviewReportsResolvedIntegrationEvent"/> (US-051, dismiss del último report).
/// Si la reseña está UnderReview, la restaura a Published y escribe el audit log (action =
/// ModeratorDecision, decision = restored). Idempotente: si no está UnderReview (ya Published, Removed
/// o Deleted), no-op. Corre en scope [Transactional].
/// </summary>
public static class ReviewReportsResolvedHandler
{
    public static async Task Handle(
        ReviewReportsResolvedIntegrationEvent message,
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

        var restored = review.RestoreFromReports(clock);
        if (!restored)
        {
            return;
        }

        var changesJson = JsonSerializer.Serialize(new { decision = "restored" });

        auditLog.Add(ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.ModeratorDecision,
            changesJson,
            message.ModeratorUserId,
            clock.UtcNow));

        await unitOfWork.SaveChangesAsync(ct);
    }
}
