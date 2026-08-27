using System.Text.Json;
using Planb.Enrollments.Application.Contracts;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.DeleteOwnReview;

/// <summary>
/// Handler for US-055 (author soft-deletes their own review). Flow:
/// <list type="number">
///   <item>Resolve the active StudentProfile (anti-enumeration: missing or inactive
///         profile returns NotFound, same as edit/publish).</item>
///   <item>Load the review; missing returns NotFound.</item>
///   <item>Ownership cross-BC (review -> enrollment -> profile). Mismatch returns NotFound,
///         not Forbidden, to avoid leaking the existence of someone else's review.</item>
///   <item>Soft delete via <see cref="Review.Delete"/>. Idempotent: if already deleted the
///         handler returns success without writing a new audit entry or raising the event.</item>
///   <item>On an actual delete, append the audit log entry and let the aggregate raise the
///         domain event (translated to the integration event by the outbox).</item>
/// </list>
///
/// Once the review is Deleted, the read-side queries (pending + mine) treat it as gone:
/// the cursada reappears in Pendientes and the review drops from Mías. That re-projection
/// lives in the Dapper query services, not here.
/// </summary>
public static class DeleteOwnReviewCommandHandler
{
    public static async Task<Result<DeleteOwnReviewResponse>> Handle(
        DeleteOwnReviewCommand command,
        IReviewRepository reviews,
        IReviewAuditLogRepository auditLog,
        IReviewsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IEnrollmentsQueryService enrollments,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<DeleteOwnReviewResponse>(ReviewErrors.NotFound);
        }

        var reviewId = new ReviewId(command.ReviewId);
        var review = await reviews.FindByIdAsync(reviewId, ct);
        if (review is null)
        {
            return Result.Failure<DeleteOwnReviewResponse>(ReviewErrors.NotFound);
        }

        var enrollment = await enrollments.GetEnrollmentByIdAsync(review.EnrollmentId, ct);
        if (enrollment is null || enrollment.StudentProfileId != profile.Id)
        {
            return Result.Failure<DeleteOwnReviewResponse>(ReviewErrors.NotFound);
        }

        // Removed es terminal para el autor. El docstring de Review.Delete ya decía que "el caller
        // mapea eso a un conflicto", pero el caller no lo hacía: el guard del aggregate solo frena
        // Deleted, así que desde Removed la transición pasaba.
        //
        // Lo que eso habilitaba: el moderador remueve una difamación, el autor borra su propia
        // reseña (pasa a Deleted, y el unique parcial filtra por status <> 'Deleted', así que la
        // cursada queda libre), y republica el mismo texto como fila nueva sin los reportes upheld
        // encima. El moderador no tiene ningún botón para deshacerlo.
        if (review.Status == ReviewStatus.Removed)
        {
            return Result.Failure<DeleteOwnReviewResponse>(ReviewErrors.CannotDeleteRemovedReview);
        }

        // Y tampoco mientras hay reportes abiertos mirándola. Cortar solo en Removed dejaba abierta
        // la ventana entre que se alcanza el threshold y que un moderador decide, que es justo
        // cuando el autor tiene el incentivo de sacarla y republicarla limpia. La cuarentena del
        // filtro automático y la invalidación por cambio de cursada sí se pueden borrar: no hay
        // reportes de los que escaparse, y para la segunda ADR-0063 ya prevé borrar como una salida
        // válida para el alumno.
        if (review.Status == ReviewStatus.UnderReview && review.UnderReviewReason == UnderReviewReason.Reports)
        {
            return Result.Failure<DeleteOwnReviewResponse>(ReviewErrors.CannotDeleteReportedReview);
        }

        var deletedNow = review.Delete(ReviewDeletedReason.Self, clock);

        if (deletedNow)
        {
            var changesJson = JsonSerializer.Serialize(new { reason = "self" });
            var entry = ReviewAuditLog.Record(
                review.Id,
                ReviewAuditAction.Deleted,
                changesJson,
                command.UserId,
                clock.UtcNow);
            auditLog.Add(entry);

            await unitOfWork.SaveChangesAsync(ct);
        }

        return new DeleteOwnReviewResponse(
            review.Id.Value,
            review.Status.ToString(),
            review.DeletedAt);
    }
}
