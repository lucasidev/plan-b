namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Respuesta de POST /api/reviews. El status es string (Pascal) para que el frontend matchee
/// contra la unión visible ("Published" / "UnderReview").
/// </summary>
public sealed record PublishReviewResponse(
    Guid Id,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    int DifficultyRating,
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade,
    string Status,
    DateTimeOffset CreatedAt);
