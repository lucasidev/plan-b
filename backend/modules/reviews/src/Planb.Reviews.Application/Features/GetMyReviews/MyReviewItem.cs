namespace Planb.Reviews.Application.Features.GetMyReviews;

/// <summary>
/// One row of the "my reviews" listing surfaced by GET /api/reviews/me (US-048 tab Mías).
///
/// Mirrors the persisted `reviews.reviews` row joined with `academic.subjects` for the
/// human-readable subject reference. Teacher and commission display strings are NOT
/// included for the same reason as the pending listing: those Academic aggregates do not
/// exist yet (will be added when US-063 / US-065 land).
///
/// <para>
/// `status` is the string form of the domain enum (`Published`, `UnderReview`, `Removed`).
/// The frontend renders a chip based on it: green for Published, amber for UnderReview,
/// gray for Removed.
/// </para>
///
/// <para>
/// `underReviewReason` is the string form of `UnderReviewReason` (`ContentFilter`, `Reports`,
/// `EnrollmentChanged`), null when <c>Status</c> is not `UnderReview`. Same Pascal-string
/// criterion as `Status` (see the comment on <c>PublishReviewResponse</c>): the frontend
/// matches against the literal union, so the value has to spell the C# enum member exactly.
/// Without this, the author cannot tell apart a quarantine they can edit their way out of
/// (`ContentFilter`, `EnrollmentChanged`) from one that needs a moderator (`Reports`).
/// </para>
/// </summary>
public sealed record MyReviewItem(
    Guid Id,
    Guid EnrollmentId,
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    string Status,
    string? UnderReviewReason,
    int DifficultyRating,
    // Los dos ejes de texto. El autor tiene que ver los dos: si solo se le devuelve el de la materia,
    // el editor de edición carga media reseña y al guardar borra el otro sin avisar.
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade,
    DateTime CreatedAt);
