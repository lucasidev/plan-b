using System.Text.Json;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.EditTeacherResponse;

/// <summary>
/// Handler de US-041 (editar respuesta docente). Flow:
/// <list type="number">
///   <item>Cargar la reseña con su respuesta (AutoInclude). 404 si no existe respuesta.</item>
///   <item>Authz cross-BC: el user tiene que seguir siendo un TeacherProfile verificado del docente
///         reseñado (revalida verified al momento del edit, no solo al responder). 403 si no.</item>
///   <item>Cooldown: máximo 3 edits de la respuesta en 24h (cuenta entries ResponseEdited del audit
///         log). Excedido devuelve un error que el endpoint mapea a 429.</item>
///   <item><c>Review.EditResponse</c> + audit log con diff { before, after } + persistir.</item>
/// </list>
/// </summary>
public static class EditTeacherResponseCommandHandler
{
    private const int EditsPer24hCap = 3;
    private static readonly TimeSpan CooldownWindow = TimeSpan.FromHours(24);

    public static async Task<Result<EditTeacherResponseResponse>> Handle(
        EditTeacherResponseCommand command,
        IReviewRepository reviews,
        IReviewsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IReviewAuditLogRepository auditLog,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var reviewId = new ReviewId(command.ReviewId);
        var review = await reviews.FindByIdAsync(reviewId, ct);
        if (review is null || review.Response is null)
        {
            return ReviewErrors.ResponseNotFound;
        }

        var isVerifiedTeacher = await identity.HasVerifiedTeacherProfileAsync(
            command.UserId, review.DocenteResenadoId, ct);
        if (!isVerifiedTeacher)
        {
            return ReviewErrors.NotVerifiedTeacherForReview;
        }

        var since = clock.UtcNow - CooldownWindow;
        var recentEdits = await auditLog.CountByActionSinceAsync(
            reviewId, ReviewAuditAction.ResponseEdited, since, ct);
        if (recentEdits >= EditsPer24hCap)
        {
            return ReviewErrors.ResponseEditCooldownExceeded;
        }

        var textResult = ReviewText.Create(command.Text);
        if (textResult.IsFailure)
        {
            return textResult.Error;
        }

        var before = review.Response.Text.Value;

        var editResult = review.EditResponse(textResult.Value, clock);
        if (editResult.IsFailure)
        {
            return editResult.Error;
        }

        var after = review.Response.Text.Value;
        auditLog.Add(ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.ResponseEdited,
            JsonSerializer.Serialize(new { before, after }),
            command.UserId,
            clock.UtcNow));

        await unitOfWork.SaveChangesAsync(ct);

        return new EditTeacherResponseResponse(
            review.Id.Value,
            review.Response.TeacherId,
            review.Response.Text.Value,
            review.Response.UpdatedAt);
    }
}
