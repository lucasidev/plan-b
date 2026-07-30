using System.Text.Json;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Consumer de <see cref="ReviewReportsResolvedIntegrationEvent"/> (US-051, dismiss del último report).
/// Si la reseña está UnderReview por reportes, la restaura a Published y escribe el audit log
/// (action = ModeratorDecision, decision = restored). Si no está UnderReview (ya Published, Removed
/// o Deleted), no-op silencioso. Corre en scope [Transactional].
///
/// <para>
/// Idempotente en todos sus caminos salvo uno, marcado en el código: cuando la reseña sigue
/// UnderReview por una razón que no son los reportes, la entrada de audit log que registra que la
/// decisión no aplicó se puede escribir dos veces si el mensaje se reentrega.
/// </para>
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
            // El caso en que la reseña sigue UnderReview por una razón que no es reports no puede
            // ser un return silencioso: el moderador desestimó el report y su decisión no aplicó, y
            // sin esta entrada no queda registro de que pasó ni de por qué. Los demás no-op (ya
            // Published, Removed, Deleted) sí son silenciosos: ahí la decisión del moderador no
            // cambiaba nada porque el estado ya era el que corresponde.
            if (review.Status == ReviewStatus.UnderReview && review.UnderReviewReason != UnderReviewReason.Reports)
            {
                // El mapeo es explícito y no derivado del nombre del enum porque estos strings se
                // persisten: renombrar un miembro no tiene que cambiar lo que ya está escrito en el
                // audit log. El default es inalcanzable (el if de arriba excluye Reports y el
                // invariante del aggregate excluye null), pero registra lo que haya en vez de tirar:
                // este handler corre sobre el outbox durable, y una excepción acá deja el mensaje
                // reintentando para siempre en vez de dejar registro de la decisión del moderador.
                var reason = review.UnderReviewReason switch
                {
                    UnderReviewReason.ContentFilter => "content_filter",
                    UnderReviewReason.EnrollmentChanged => "enrollment_changed",
                    _ => review.UnderReviewReason?.ToString() ?? "unknown",
                };

                // A diferencia del branch "restored" de abajo, esta escritura no es redelivery-safe:
                // el gate de esa rama es que RestoreFromReports ya no tiene nada para mutar en un
                // segundo intento (Status ya cambió). Acá el aggregate no cambia nunca (por diseño:
                // es justamente el caso "no hizo falta restaurar nada"), así que la condición de
                // arriba sigue siendo cierta en una reentrega del mismo mensaje y esta entrada se
                // volvería a escribir. Conocido, sin mecanismo de dedup todavía.
                auditLog.Add(ReviewAuditLog.Record(
                    review.Id,
                    ReviewAuditAction.ModeratorDecision,
                    JsonSerializer.Serialize(new
                    {
                        decision = "not_restored",
                        reason,
                    }),
                    message.ModeratorUserId,
                    clock.UtcNow));

                await unitOfWork.SaveChangesAsync(ct);
            }

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
