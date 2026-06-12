namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Body de POST /api/reviews. El <c>userId</c> se deriva del JWT y NO viene en el body.
///
/// <para>
/// <see cref="OverallRating"/>, <see cref="WouldRecommendCourse"/> y
/// <see cref="WouldRetakeTeacher"/> son requeridos (US-089). <see cref="HoursPerWeek"/> y
/// <see cref="Tags"/> son opcionales: <c>Tags</c> default a lista vacía si el body lo omite.
/// </para>
/// </summary>
public sealed record PublishReviewRequest(
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    int DifficultyRating,
    int OverallRating,
    int? HoursPerWeek,
    IReadOnlyList<string>? Tags,
    bool WouldRecommendCourse,
    bool WouldRetakeTeacher,
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade);
