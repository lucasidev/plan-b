using System.Text.Json;
using Planb.Enrollments.Application.Contracts;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.ContentFilter;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.EditReview;

/// <summary>
/// Handler for US-018 (edit own review). Flow:
/// <list type="number">
///   <item>Resolve the active StudentProfile for the user (same anti-enumeration as
///         publish: missing or inactive profile returns NotFound).</item>
///   <item>Load the review; if missing, NotFound. If status is not Published, return
///         InvalidStatusTransition (ADR-0012).</item>
///   <item>Cross-check ownership via enrollments: the enrollment behind the review must
///         belong to the current user's profile. We do not rely on a "user id" column in
///         the review row.</item>
///   <item>Cooldown: count "Edited" audit log entries for this review in the last 24h. If
///         the count is at the cap, return EditCooldownExceeded.</item>
///   <item>Build the patch VOs only for the fields the caller provided.</item>
///   <item>Apply the patch tentatively to a string snapshot to feed the content filter
///         with the post-patch text, then call <see cref="Review.Edit"/>.</item>
///   <item>Append the audit log entry with the diff. Persisted in the same transaction
///         (Wolverine [Transactional]).</item>
/// </list>
/// </summary>
public static class EditReviewCommandHandler
{
    private const int EditsPer24hCap = 5;
    private static readonly TimeSpan CooldownWindow = TimeSpan.FromHours(24);

    public static async Task<Result<EditReviewResponse>> Handle(
        EditReviewCommand command,
        IReviewRepository reviews,
        IReviewAuditLogRepository auditLog,
        IReviewsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IEnrollmentsQueryService enrollments,
        IReviewContentFilter contentFilter,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (!command.SubjectTextProvided
            && !command.TeacherTextProvided
            && !command.FinalGradeProvided
            && command.DifficultyRating is null)
        {
            return Result.Failure<EditReviewResponse>(ReviewErrors.NothingToUpdate);
        }

        // 1) Profile activo (mismo guard que publish para no leakear existencia de reviews).
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<EditReviewResponse>(ReviewErrors.NotFound);
        }

        // 2) Cargar la review.
        var reviewId = new ReviewId(command.ReviewId);
        var review = await reviews.FindByIdAsync(reviewId, ct);
        if (review is null)
        {
            return Result.Failure<EditReviewResponse>(ReviewErrors.NotFound);
        }

        if (review.Status != ReviewStatus.Published)
        {
            return Result.Failure<EditReviewResponse>(ReviewErrors.InvalidStatusTransition);
        }

        // 3) Ownership cross-BC. La review apunta a un enrollment; el enrollment a un
        //    student profile. Ese profile tiene que ser el del user actual.
        var enrollment = await enrollments.GetEnrollmentByIdAsync(review.EnrollmentId, ct);
        if (enrollment is null || enrollment.StudentProfileId != profile.Id)
        {
            // Devolvemos NotFound, no Forbidden: el caller no tiene por qué saber que la
            // review existe si no es suya. Same anti-enumeration que publish.
            return Result.Failure<EditReviewResponse>(ReviewErrors.NotFound);
        }

        // 4) Cooldown.
        var since = clock.UtcNow - CooldownWindow;
        var recentEdits = await auditLog.CountByActionSinceAsync(
            reviewId, ReviewAuditAction.Edited, since, ct);
        if (recentEdits >= EditsPer24hCap)
        {
            return Result.Failure<EditReviewResponse>(ReviewErrors.EditCooldownExceeded);
        }

        // 5) VOs para los campos provistos. Strings vacíos en text fields representan "clear".
        DifficultyRating? newDifficulty = null;
        if (command.DifficultyRating is not null)
        {
            var dr = DifficultyRating.Create(command.DifficultyRating.Value);
            if (dr.IsFailure) return Result.Failure<EditReviewResponse>(dr.Error);
            newDifficulty = dr.Value;
        }

        ReviewText? newSubjectText = null;
        if (command.SubjectTextProvided)
        {
            var st = ReviewText.CreateOptional(string.IsNullOrEmpty(command.SubjectText) ? null : command.SubjectText);
            if (st.IsFailure) return Result.Failure<EditReviewResponse>(st.Error);
            newSubjectText = st.Value;
        }

        ReviewText? newTeacherText = null;
        if (command.TeacherTextProvided)
        {
            var tt = ReviewText.CreateOptional(string.IsNullOrEmpty(command.TeacherText) ? null : command.TeacherText);
            if (tt.IsFailure) return Result.Failure<EditReviewResponse>(tt.Error);
            newTeacherText = tt.Value;
        }

        FinalGrade? newFinalGrade = null;
        if (command.FinalGradeProvided && command.FinalGrade is not null)
        {
            var fg = FinalGrade.Create(command.FinalGrade.Value);
            if (fg.IsFailure) return Result.Failure<EditReviewResponse>(fg.Error);
            newFinalGrade = fg.Value;
        }

        // 6) Pre-compute the post-patch texts to feed the content filter on the version
        //    the user would see, not on the union of stale + new.
        var subjectTextForFilter = command.SubjectTextProvided
            ? command.SubjectText
            : review.SubjectText?.Value;
        var teacherTextForFilter = command.TeacherTextProvided
            ? command.TeacherText
            : review.TeacherText?.Value;
        var filterResult = contentFilter.Evaluate(subjectTextForFilter, teacherTextForFilter);
        var statusAfter = filterResult.Verdict == ContentFilterVerdict.Clean
            ? ReviewStatus.Published
            : ReviewStatus.UnderReview;

        // Snapshot BEFORE the mutation for the audit diff.
        var before = new
        {
            difficultyRating = review.DifficultyRating.Value,
            subjectText = review.SubjectText?.Value,
            teacherText = review.TeacherText?.Value,
            finalGrade = review.FinalGrade?.Value,
            status = review.Status.ToString(),
        };

        var editResult = review.Edit(
            newDifficulty,
            newSubjectText,
            command.SubjectTextProvided,
            newTeacherText,
            command.TeacherTextProvided,
            newFinalGrade,
            command.FinalGradeProvided,
            statusAfter,
            clock);

        if (editResult.IsFailure)
        {
            return Result.Failure<EditReviewResponse>(editResult.Error);
        }

        // 7) Audit log diff (only fields that changed).
        var after = new
        {
            difficultyRating = review.DifficultyRating.Value,
            subjectText = review.SubjectText?.Value,
            teacherText = review.TeacherText?.Value,
            finalGrade = review.FinalGrade?.Value,
            status = review.Status.ToString(),
        };
        var changesJson = JsonSerializer.Serialize(new { before, after });

        var entry = ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.Edited,
            changesJson,
            command.UserId,
            clock.UtcNow);
        auditLog.Add(entry);

        await unitOfWork.SaveChangesAsync(ct);

        return new EditReviewResponse(
            review.Id.Value,
            review.EnrollmentId,
            review.DocenteResenadoId,
            review.DifficultyRating.Value,
            review.SubjectText?.Value,
            review.TeacherText?.Value,
            review.FinalGrade?.Value,
            review.Status.ToString(),
            review.UpdatedAt);
    }
}
