using Planb.Enrollments.Application.Contracts;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.ContentFilter;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Handler de US-017 (publicar reseña). Flow:
/// <list type="number">
///   <item>Resolver el <see cref="StudentProfileSummary"/> activo del user (sin profile activo →
///         NotFound, mismo mensaje que enrollment-no-owned, antienumeration).</item>
///   <item>Traer el <see cref="EnrollmentSummary"/>. Validar ownership (StudentProfileId del
///         enrollment coincide con el del user actual), status (no <c>Cursando</c>) y que
///         tenga commission asociada.</item>
///   <item>Idempotency: si ya existe Review para ese enrollment → 409 Conflict.</item>
///   <item>Construir los VOs (DifficultyRating, ReviewText opcionales, FinalGrade opcional).</item>
///   <item>Correr el filter de contenido. Clean → Published; Triggered → UnderReview.</item>
///   <item>Invocar <see cref="Review.Publish"/>. El factory enforca "al menos un texto" y raise
///         el domain event correspondiente.</item>
///   <item>Add al repo. SaveChanges lo dispara el middleware Wolverine [Transactional].</item>
/// </list>
/// </summary>
public static class PublishReviewCommandHandler
{
    public static async Task<Result<PublishReviewResponse>> Handle(
        PublishReviewCommand command,
        IReviewRepository reviews,
        IReviewsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IEnrollmentsQueryService enrollments,
        IReviewContentFilter contentFilter,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // 1) Profile activo del user.
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return ReviewErrors.EnrollmentNotFoundOrNotOwned;
        }

        // 2) Enrollment + ownership + status + commission.
        var enrollment = await enrollments.GetEnrollmentByIdAsync(command.EnrollmentId, ct);
        if (enrollment is null || enrollment.StudentProfileId != profile.Id)
        {
            return ReviewErrors.EnrollmentNotFoundOrNotOwned;
        }

        if (enrollment.Status == EnrollmentStatusSnapshot.Cursando)
        {
            return ReviewErrors.EnrollmentStillOngoing;
        }

        if (enrollment.CommissionId is null)
        {
            return ReviewErrors.EnrollmentWithoutCommission;
        }

        // 3) Idempotency.
        var existing = await reviews.FindByEnrollmentIdAsync(command.EnrollmentId, ct);
        if (existing is not null)
        {
            return ReviewErrors.AlreadyExistsForEnrollment;
        }

        // 4) Construcción de VOs.
        var difficultyResult = DifficultyRating.Create(command.DifficultyRating);
        if (difficultyResult.IsFailure)
        {
            return difficultyResult.Error;
        }

        var subjectTextResult = ReviewText.CreateOptional(command.SubjectText);
        if (subjectTextResult.IsFailure)
        {
            return subjectTextResult.Error;
        }

        var teacherTextResult = ReviewText.CreateOptional(command.TeacherText);
        if (teacherTextResult.IsFailure)
        {
            return teacherTextResult.Error;
        }

        FinalGrade? finalGrade = null;
        if (command.FinalGrade is not null)
        {
            var gradeResult = FinalGrade.Create(command.FinalGrade.Value);
            if (gradeResult.IsFailure)
            {
                return gradeResult.Error;
            }
            finalGrade = gradeResult.Value;
        }

        // 5) Content filter. El filter trabaja con el string original (no con el VO) para que
        // pueda ver el texto en bruto incluso si por algún motivo fue truncado al construir.
        var filterResult = contentFilter.Evaluate(command.SubjectText, command.TeacherText);
        var initialStatus = filterResult.Verdict == ContentFilterVerdict.Clean
            ? ReviewStatus.Published
            : ReviewStatus.UnderReview;

        // 6) Aggregate factory.
        var reviewResult = Review.Publish(
            command.EnrollmentId,
            command.DocenteResenadoId,
            difficultyResult.Value,
            subjectTextResult.Value,
            teacherTextResult.Value,
            finalGrade,
            initialStatus,
            clock);

        if (reviewResult.IsFailure)
        {
            return reviewResult.Error;
        }

        var review = reviewResult.Value;
        reviews.Add(review);
        await unitOfWork.SaveChangesAsync(ct);

        return new PublishReviewResponse(
            review.Id.Value,
            review.EnrollmentId,
            review.DocenteResenadoId,
            review.DifficultyRating.Value,
            review.SubjectText?.Value,
            review.TeacherText?.Value,
            review.FinalGrade?.Value,
            review.Status.ToString(),
            review.CreatedAt);
    }
}
