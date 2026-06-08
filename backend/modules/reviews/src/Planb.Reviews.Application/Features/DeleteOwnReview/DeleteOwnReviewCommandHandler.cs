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
