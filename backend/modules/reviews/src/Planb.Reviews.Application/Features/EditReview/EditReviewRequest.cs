namespace Planb.Reviews.Application.Features.EditReview;

/// <summary>
/// Body of PATCH /api/me/reviews/{id} (US-018). All fields are optional: a missing field
/// means "leave it as is". Text fields use the empty string as the explicit "clear it"
/// signal (null is not "clear", it is "no change"), but the at-least-one-text invariant
/// stays enforced by the aggregate.
/// </summary>
public sealed record EditReviewRequest(
    int? DifficultyRating,
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade);
