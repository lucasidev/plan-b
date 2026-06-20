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
    DateTime CreatedAt);
