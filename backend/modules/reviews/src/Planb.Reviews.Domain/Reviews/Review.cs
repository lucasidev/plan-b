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

    /// <summary>
    /// US-055 soft delete. Null while the review is live. When the author deletes it the
    /// row is kept (for audit + orphan TeacherResponse handling) and these are stamped.
    /// </summary>
    public DateTimeOffset? DeletedAt { get; private set; }

    /// <summary>
    /// Who/why the review was deleted. <c>self</c> for the author (US-055); future values
    /// (e.g. <c>moderator</c>) land with US-051. Stored as text.
    /// </summary>
    public ReviewDeletedReason? DeletedReason { get; private set; }

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

    /// <summary>
    /// Mutates the aggregate state for US-018 (edit). The caller (handler) is responsible
    /// for:
    /// <list type="bullet">
    ///   <item>Authoritative ownership check (StudentProfile of the enrollment matches the
    ///         current user).</item>
    ///   <item>Cooldown enforcement (max 5 edits per 24h).</item>
    ///   <item>Re-running the content filter on the new texts and passing the resulting
    ///         status as <paramref name="statusAfter"/>.</item>
    ///   <item>Writing the audit log entry with the diff.</item>
    /// </list>
    ///
    /// <para>
    /// This method enforces only the domain rule: edits are allowed exclusively from
    /// <see cref="ReviewStatus.Published"/> (ADR-0012). UnderReview reviews wait for the
    /// moderator; Removed reviews are sealed; Deleted reviews are gone for the author.
    /// </para>
    ///
    /// <para>
    /// All field parameters are nullable to support partial updates. A <c>null</c> field
    /// means "leave it as is"; a non-null field overwrites the current value (passing the
    /// existing value as-is is a no-op, the diff in the audit log will be empty for that
    /// field). The "at least one text" invariant is re-checked after the patch is applied.
    /// </para>
    /// </summary>
    public Result Edit(
        DifficultyRating? newDifficultyRating,
        ReviewText? newSubjectText,
        bool subjectTextProvided,
        ReviewText? newTeacherText,
        bool teacherTextProvided,
        FinalGrade? newFinalGrade,
        bool finalGradeProvided,
        ReviewStatus statusAfter,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status != ReviewStatus.Published)
        {
            return Result.Failure(ReviewErrors.InvalidStatusTransition);
        }

        if (statusAfter is not (ReviewStatus.Published or ReviewStatus.UnderReview))
        {
            throw new ArgumentException(
                $"Status after edit must be Published or UnderReview, got {statusAfter}.",
                nameof(statusAfter));
        }

        // Apply the patch tentatively to local snapshots so we can validate the post-patch
        // state before mutating the aggregate.
        var nextDifficulty = newDifficultyRating ?? DifficultyRating;
        var nextSubjectText = subjectTextProvided ? newSubjectText : SubjectText;
        var nextTeacherText = teacherTextProvided ? newTeacherText : TeacherText;
        var nextFinalGrade = finalGradeProvided ? newFinalGrade : FinalGrade;

        if (nextSubjectText is null && nextTeacherText is null)
        {
            return Result.Failure(ReviewErrors.AtLeastOneTextRequired);
        }

        var statusBefore = Status;
        var now = clock.UtcNow;

        DifficultyRating = nextDifficulty;
        SubjectText = nextSubjectText;
        TeacherText = nextTeacherText;
        FinalGrade = nextFinalGrade;
        Status = statusAfter;
        UpdatedAt = now;

        Raise(new ReviewEditedDomainEvent(
            Id,
            EnrollmentId,
            DocenteResenadoId,
            statusBefore,
            statusAfter,
            now));

        return Result.Success();
    }

    /// <summary>
    /// Soft delete by the author (US-055). Idempotent: deleting an already-deleted review
    /// returns success without re-stamping (so a retry does not move the timestamp). The
    /// row is preserved; only the status + delete metadata change, which removes the review
    /// from every public read (feed, rankings) and from the author's own listing.
    ///
    /// <para>
    /// Allowed from <see cref="ReviewStatus.Published"/> and <see cref="ReviewStatus.UnderReview"/>
    /// per the US-055 AC. A <see cref="ReviewStatus.Removed"/> review was taken down by a
    /// moderator, so the author self-delete does not apply (the caller maps that to a
    /// no-op-style conflict if it ever reaches here).
    /// </para>
    ///
    /// Returns <c>true</c> when this call performed the deletion, <c>false</c> when it was
    /// already deleted (idempotent path). The handler uses this to decide whether to write
    /// an audit log entry + raise the integration event.
    /// </summary>
    public bool Delete(ReviewDeletedReason reason, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status == ReviewStatus.Deleted)
        {
            return false;
        }

        var now = clock.UtcNow;
        var statusBefore = Status;

        Status = ReviewStatus.Deleted;
        DeletedAt = now;
        DeletedReason = reason;
        UpdatedAt = now;

        Raise(new ReviewDeletedDomainEvent(
            Id,
            EnrollmentId,
            DocenteResenadoId,
            statusBefore,
            reason,
            now));

        return true;
    }
}
