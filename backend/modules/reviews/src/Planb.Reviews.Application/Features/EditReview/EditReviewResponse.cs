namespace Planb.Reviews.Application.Features.EditReview;

/// <summary>
/// Body returned by PATCH /api/me/reviews/{id}. Mirrors the publish response shape so the
/// frontend can swap them transparently. Status is returned as text to match the public
/// feed contract.
/// </summary>
public sealed record EditReviewResponse(
    Guid Id,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    int DifficultyRating,
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade,
    string Status,
    DateTimeOffset UpdatedAt);
