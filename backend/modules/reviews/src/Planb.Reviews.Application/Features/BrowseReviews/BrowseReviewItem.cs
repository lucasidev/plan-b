namespace Planb.Reviews.Application.Features.BrowseReviews;

/// <summary>
/// Single row of the public feed surfaced by GET /api/reviews (US-048 tab Explorar).
///
/// Public payload: nothing identifies the author beyond a year-in-career string the
/// student set in their profile + the cursada period. Per ADR-0009 (anonymity), no
/// email / name / display name / studentProfileId is ever exposed here.
///
/// Teacher and commission display strings are absent for the same reason as the other
/// listings: the Academic aggregates do not exist yet. The feed surfaces subject + the full
/// review model (US-089: overall rating, difficulty, hours, tags, recommendations) + text
/// snippet + grade + period.
/// </summary>
public sealed record BrowseReviewItem(
    Guid Id,
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    int DifficultyRating,
    int OverallRating,
    int? HoursPerWeek,
    IReadOnlyList<string> Tags,
    bool WouldRecommendCourse,
    bool WouldRetakeTeacher,
    string? SubjectText,
    decimal? FinalGrade,
    DateTime CreatedAt,
    // Votos de utilidad (helpfulness). MyVoteIsHelpful: null si el caller no votó (o es
    // anónimo), true = votó útil, false = votó no útil. Sirve para resaltar el botón activo.
    int HelpfulCount,
    int NotHelpfulCount,
    bool? MyVoteIsHelpful,
    // US-040: respuesta del docente. Null si nadie respondió. A diferencia del autor de la
    // reseña (anónimo, ADR-0009), el docente que responde aparece con su nombre. ResponseUpdatedAt
    // > ResponseCreatedAt marca que fue editada (US-041).
    string? ResponseText,
    string? ResponseAuthorName,
    DateTime? ResponseCreatedAt,
    DateTime? ResponseUpdatedAt);
