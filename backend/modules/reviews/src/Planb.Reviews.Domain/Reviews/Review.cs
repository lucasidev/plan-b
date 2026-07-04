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

    /// <summary>
    /// Overall quality the student gave the course (US-089). Distinct axis from
    /// <see cref="DifficultyRating"/>: how good vs how hard. Required, set at publish time.
    /// </summary>
    public OverallRating OverallRating { get; private set; }

    /// <summary>
    /// Self-reported hours of study per week outside of class (US-089). Optional (the editor
    /// lets the student skip it); range 0-30 when present. Feeds the US-002 crowd insights.
    /// </summary>
    public int? HoursPerWeek { get; private set; }

    /// <summary>
    /// Quick descriptive tags from the fixed taxonomy (US-089). Required but may be empty.
    /// Stored as a Postgres <c>text[]</c>. The allowed set is centralised in the application
    /// layer (<c>AllowedTags</c>); the aggregate keeps the list as-is once validated upstream.
    /// </summary>
    public IReadOnlyList<string> Tags { get; private set; } = [];

    /// <summary>Whether the student would recommend taking this course (US-089). Required.</summary>
    public bool WouldRecommendCourse { get; private set; }

    /// <summary>Whether the student would take this teacher again (US-089). Required.</summary>
    public bool WouldRetakeTeacher { get; private set; }

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

    /// <summary>
    /// US-040: la respuesta del docente verificado a esta reseña. Null mientras nadie respondió;
    /// una sola por reseña (child entity owned). Se hidrata con la reseña (AutoInclude).
    /// </summary>
    public TeacherResponse? Response { get; private set; }

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
        OverallRating overallRating,
        int? hoursPerWeek,
        IReadOnlyList<string>? tags,
        bool wouldRecommendCourse,
        bool wouldRetakeTeacher,
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
            OverallRating = overallRating,
            HoursPerWeek = hoursPerWeek,
            Tags = tags ?? [],
            WouldRecommendCourse = wouldRecommendCourse,
            WouldRetakeTeacher = wouldRetakeTeacher,
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
        OverallRating? newOverallRating,
        int? newHoursPerWeek,
        bool hoursPerWeekProvided,
        IReadOnlyList<string>? newTags,
        bool? newWouldRecommendCourse,
        bool? newWouldRetakeTeacher,
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
        // state before mutating the aggregate. Each field keeps its current value unless the
        // caller signalled a change: a null VO / null bool means "not provided"; hours uses an
        // explicit flag because null is itself a valid value (the student cleared the field).
        var nextDifficulty = newDifficultyRating ?? DifficultyRating;
        var nextOverallRating = newOverallRating ?? OverallRating;
        var nextHoursPerWeek = hoursPerWeekProvided ? newHoursPerWeek : HoursPerWeek;
        var nextTags = newTags ?? Tags;
        var nextWouldRecommendCourse = newWouldRecommendCourse ?? WouldRecommendCourse;
        var nextWouldRetakeTeacher = newWouldRetakeTeacher ?? WouldRetakeTeacher;
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
        OverallRating = nextOverallRating;
        HoursPerWeek = nextHoursPerWeek;
        Tags = nextTags;
        WouldRecommendCourse = nextWouldRecommendCourse;
        WouldRetakeTeacher = nextWouldRetakeTeacher;
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

    /// <summary>
    /// Auto-quarantine driven by crowd reports (US-019). When the open report count for a
    /// review crosses the configurable threshold (ADR-0010), Moderation publishes a
    /// quarantine request that the Reviews consumer applies through this method.
    ///
    /// Idempotent and narrow: only a <see cref="ReviewStatus.Published"/> review moves to
    /// <see cref="ReviewStatus.UnderReview"/>. A review already UnderReview, Removed, or
    /// Deleted is left untouched (returns <c>false</c>) so repeated threshold events or a
    /// race do not thrash the status. No domain event is raised: the consumer writes the
    /// audit-log entry, and re-raising the publish-time ReviewQuarantined event would risk
    /// a feedback loop.
    /// </summary>
    public bool QuarantineByReports(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status != ReviewStatus.Published)
        {
            return false;
        }

        Status = ReviewStatus.UnderReview;
        UpdatedAt = clock.UtcNow;
        return true;
    }

    /// <summary>
    /// Responde la reseña como el docente reseñado (US-040). El caller (handler) ya validó que el
    /// user es un <c>TeacherProfile</c> verificado para <see cref="DocenteResenadoId"/> (cross-BC) y
    /// que la reseña no tiene respuesta todavía (idempotencia: si la tiene, el handler devuelve la
    /// existente sin re-invocar esto).
    ///
    /// <para>
    /// Reglas del aggregate: solo se responde una reseña <see cref="ReviewStatus.Published"/>; una
    /// sola respuesta por reseña; y <paramref name="teacherId"/> debe ser el docente reseñado (la
    /// respuesta es del docente sobre el que se opinó, no de un tercero).
    /// </para>
    /// </summary>
    public Result Respond(Guid teacherId, ReviewText text, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status != ReviewStatus.Published)
        {
            return ReviewErrors.CannotRespondToNonPublished;
        }
        if (Response is not null)
        {
            return ReviewErrors.ResponseAlreadyExists;
        }
        if (teacherId != DocenteResenadoId)
        {
            return ReviewErrors.NotVerifiedTeacherForReview;
        }

        var now = clock.UtcNow;
        Response = new TeacherResponse(TeacherResponseId.New(), teacherId, text, now);
        UpdatedAt = now;
        return Result.Success();
    }

    /// <summary>
    /// Edita la respuesta del docente (US-041). El caller (handler) ya validó que el user sea el
    /// docente verificado del reseñado (cross-BC) y el cooldown. Acá solo se exige que exista una
    /// respuesta; el resto (autoría, verificación vigente) es responsabilidad del handler.
    /// </summary>
    public Result EditResponse(ReviewText text, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Response is null)
        {
            return ReviewErrors.ResponseNotFound;
        }

        Response.Edit(text, clock);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }
}
