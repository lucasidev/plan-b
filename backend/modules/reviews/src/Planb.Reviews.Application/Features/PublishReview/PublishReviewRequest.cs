namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Body de POST /api/reviews. El <c>userId</c> se deriva del JWT y NO viene en el body.
/// </summary>
public sealed record PublishReviewRequest(
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    int DifficultyRating,
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade);
