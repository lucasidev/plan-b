using System.Text.Json;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.RespondToReview;

/// <summary>
/// Handler de US-040 (responder reseña). Flow:
/// <list type="number">
///   <item>Cargar la reseña (con su respuesta, AutoInclude). 404 si no existe.</item>
///   <item>Solo se responde una reseña Published (no UnderReview / Removed / Deleted).</item>
///   <item>Idempotencia: si ya tiene respuesta, devolver la existente (200) sin tocar nada.</item>
///   <item>Authz cross-BC: el user debe ser un TeacherProfile verificado del docente reseñado
///         (claim US-030 + verificación US-031), vía IIdentityQueryService. 403 si no.</item>
///   <item>Construir el texto (VO ReviewText, 50..2000) + <c>Review.Respond</c> + audit log +
///         persistir.</item>
/// </list>
/// </summary>
public static class RespondToReviewCommandHandler
{
    public static async Task<Result<RespondToReviewResponse>> Handle(
        RespondToReviewCommand command,
        IReviewRepository reviews,
        IReviewsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IReviewAuditLogRepository auditLog,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var review = await reviews.FindByIdAsync(new ReviewId(command.ReviewId), ct);
        if (review is null)
        {
            return ReviewErrors.NotFound;
        }

        if (review.Status != ReviewStatus.Published)
        {
            return ReviewErrors.CannotRespondToNonPublished;
        }

        // Idempotencia: la reseña ya tiene respuesta → devolver la existente.
        if (review.Response is not null)
        {
            return ToResponse(review);
        }

        var isVerifiedTeacher = await identity.HasVerifiedTeacherProfileAsync(
            command.UserId, review.DocenteResenadoId, ct);
        if (!isVerifiedTeacher)
        {
            return ReviewErrors.NotVerifiedTeacherForReview;
        }

        var textResult = ReviewText.Create(command.Text);
        if (textResult.IsFailure)
        {
            return textResult.Error;
        }

        var respondResult = review.Respond(review.DocenteResenadoId, textResult.Value, clock);
        if (respondResult.IsFailure)
        {
            return respondResult.Error;
        }

        auditLog.Add(ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.ResponsePublished,
            JsonSerializer.Serialize(new { teacher_id = review.DocenteResenadoId }),
            command.UserId,
            clock.UtcNow));

        await unitOfWork.SaveChangesAsync(ct);

        return ToResponse(review);
    }

    private static RespondToReviewResponse ToResponse(Review review) =>
        new(
            review.Id.Value,
            review.Response!.TeacherId,
            review.Response.Text.Value,
            review.Response.CreatedAt);
}
