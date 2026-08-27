using Planb.Academic.Application.Contracts;
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
///         enrollment coincide con el del user actual) y status (no <c>Cursando</c>). Una cursada
///         sin commission puede reseñarse (decisión de la versión anterior del producto, retirada
///         con ADR-0063): ya no es requisito para escribir.</item>
///   <item>Resolver la identidad del docente reseñado contra Academic. Ya no se exige que esté en
///         el plantel actual de la commission de la cursada (decisión de la versión anterior del
///         producto, retirada con ADR-0063: eso afirma el presente, y una cursada vieja habla del
///         pasado); sí se exige que exista como persona en el catálogo, de donde sale el nombre
///         declarado.</item>
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
        IAcademicQueryService academic,
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

        // 2) Enrollment + ownership + status. Una cursada sin commission puede reseñarse
        // (decisión de la versión anterior del producto, retirada con ADR-0063): se retiró el
        // chequeo que lo bloqueaba.
        var enrollment = await enrollments.GetEnrollmentByIdAsync(command.EnrollmentId, ct);
        if (enrollment is null || enrollment.StudentProfileId != profile.Id)
        {
            return ReviewErrors.EnrollmentNotFoundOrNotOwned;
        }

        if (enrollment.Status == EnrollmentStatusSnapshot.InProgress)
        {
            return ReviewErrors.EnrollmentStillOngoing;
        }

        // 3) El docente reseñado tiene que existir como persona en el catálogo (decisión de la
        // versión anterior del producto, retirada con ADR-0063: la identidad sigue atada a
        // Academic). Ya no se exige que esté en el plantel de ESTA
        // commission puntual: ver ReviewErrors.TeacherNotInEnrollmentCommission (retirado). El
        // nombre declarado sale de acá porque hoy el único camino de publish llega con un id ya
        // resuelto (el picker de US-065); cuando exista un camino para nombrar un docente sin
        // resolver, ese nombre viajará tal cual lo escriba el alumno en vez de derivarse.
        var teacher = await academic.GetTeacherByIdAsync(command.ReviewedTeacherId, ct);
        if (teacher is null)
        {
            return ReviewErrors.ReviewedTeacherNotFound;
        }
        var reviewedTeacherName = $"{teacher.FirstName} {teacher.LastName}";

        // 4) Idempotency.
        var existing = await reviews.FindByEnrollmentIdAsync(command.EnrollmentId, ct);
        if (existing is not null)
        {
            return ReviewErrors.AlreadyExistsForEnrollment;
        }

        // 5) Construcción de VOs.
        var difficultyResult = DifficultyRating.Create(command.DifficultyRating);
        if (difficultyResult.IsFailure)
        {
            return difficultyResult.Error;
        }

        var overallResult = OverallRating.Create(command.OverallRating);
        if (overallResult.IsFailure)
        {
            return overallResult.Error;
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

        // 6) Content filter. El filter trabaja con el string original (no con el VO) para que
        // pueda ver el texto en bruto incluso si por algún motivo fue truncado al construir.
        var filterResult = contentFilter.Evaluate(command.SubjectText, command.TeacherText);
        var initialStatus = filterResult.Verdict == ContentFilterVerdict.Clean
            ? ReviewStatus.Published
            : ReviewStatus.UnderReview;

        // 7) Aggregate factory.
        var reviewResult = Review.Publish(
            command.EnrollmentId,
            command.UserId,
            command.ReviewedTeacherId,
            reviewedTeacherName,
            difficultyResult.Value,
            overallResult.Value,
            command.HoursPerWeek,
            command.Tags,
            command.WouldRecommendCourse,
            command.WouldRetakeTeacher,
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
            review.ReviewedTeacherId,
            review.DifficultyRating.Value,
            review.OverallRating.Value,
            review.HoursPerWeek,
            review.Tags,
            review.WouldRecommendCourse,
            review.WouldRetakeTeacher,
            review.SubjectText?.Value,
            review.TeacherText?.Value,
            review.FinalGrade?.Value,
            review.Status.ToString(),
            review.CreatedAt);
    }
}
