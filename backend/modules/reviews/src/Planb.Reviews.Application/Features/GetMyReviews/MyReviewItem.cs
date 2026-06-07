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
/// </summary>
public sealed record MyReviewItem(
    Guid Id,
    Guid EnrollmentId,
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    string Status,
    int DifficultyRating,
    string? SubjectText,
    decimal? FinalGrade,
    DateTime CreatedAt);
