using Planb.Reviews.Domain.Reviews.Events;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Aggregate root del bounded context Reviews. Reseña anclada a una cursada finalizada
/// (un <c>EnrollmentRecord</c> del módulo Enrollments). ADR-0005: el ancla es por
/// cursada, no por usuario, así una recursada con la misma cátedra puede tener su
/// propia reseña (UNIQUE por enrollment_id, no por user_id + subject_id).
///
/// <para>
/// El aggregate no conoce EnrollmentRecord ni Teacher como navigation properties. Solo
/// guarda los UUIDs. La validación cross-BC (ownership del enrollment, status no
/// cursando, docente en la commission) la hace el handler con
/// <c>IEnrollmentsQueryService</c> + <c>IAcademicQueryService</c> antes de invocar el
/// factory.
/// </para>
///
/// <para>
/// El filter de contenido (<c>IReviewContentFilter</c>) corre en el handler también,
/// y su resultado se pasa al factory como el status inicial (Published si clean,
/// UnderReview si triggered). El factory raises el domain event correspondiente.
/// </para>
/// </summary>
public sealed class Review : Entity<ReviewId>, IAggregateRoot
{
    public Guid EnrollmentId { get; private set; }
    public Guid DocenteResenadoId { get; private set; }
    public DifficultyRating DifficultyRating { get; private set; }
    public ReviewText? SubjectText { get; private set; }
    public ReviewText? TeacherText { get; private set; }
    public FinalGrade? FinalGrade { get; private set; }
    public ReviewStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Review() { }

    /// <summary>
    /// Factory de publicación (US-017). Asume que el caller (handler) ya validó:
    ///   - el enrollment existe y es del user actual,
    ///   - el enrollment no está en status 'cursando',
    ///   - el docente reseñado estaba en la commission del enrollment,
    ///   - no existe ya una Review para este enrollment (idempotency en el repo).
    ///
    /// Las únicas invariantes que valida acá son las del aggregate: al menos uno de
    /// los dos textos presente (CHECK del data-model) y los value objects de cada
    /// campo numérico ya validados al construirse.
    ///
    /// <paramref name="initialStatus"/> debe ser <see cref="ReviewStatus.Published"/>
    /// o <see cref="ReviewStatus.UnderReview"/> según el resultado del filter de
    /// contenido. Cualquier otro status es un error del caller.
    /// </summary>
    public static Result<Review> Publish(
        Guid enrollmentId,
        Guid docenteResenadoId,
        DifficultyRating difficultyRating,
        ReviewText? subjectText,
        ReviewText? teacherText,
        FinalGrade? finalGrade,
        ReviewStatus initialStatus,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (subjectText is null && teacherText is null)
        {
            return Result.Failure<Review>(ReviewErrors.AtLeastOneTextRequired);
        }

        if (initialStatus is not (ReviewStatus.Published or ReviewStatus.UnderReview))
        {
            throw new ArgumentException(
                $"Initial status must be Published or UnderReview, got {initialStatus}.",
                nameof(initialStatus));
        }

        var now = clock.UtcNow;
        var review = new Review
        {
            Id = ReviewId.New(),
            EnrollmentId = enrollmentId,
            DocenteResenadoId = docenteResenadoId,
            DifficultyRating = difficultyRating,
            SubjectText = subjectText,
            TeacherText = teacherText,
            FinalGrade = finalGrade,
            Status = initialStatus,
            CreatedAt = now,
            UpdatedAt = now,
        };

        if (initialStatus == ReviewStatus.Published)
        {
            review.Raise(new ReviewPublishedDomainEvent(review.Id, enrollmentId, docenteResenadoId, now));
        }
        else
        {
            review.Raise(new ReviewQuarantinedDomainEvent(review.Id, enrollmentId, docenteResenadoId, now));
        }

        return Result.Success(review);
    }
}
