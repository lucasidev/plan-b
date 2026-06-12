namespace Planb.Reviews.Application.Features.EditReview;

/// <summary>
/// Command for US-018 (edit own review). Carries the identifying tuple (review id,
/// authenticated user id) plus the partial patch. Nullable fields participate in partial
/// updates: missing in the request stays null here, which the handler interprets as "do
/// not touch".
///
/// <para>
/// The text fields carry a tri-state semantics:
/// <list type="bullet">
///   <item><c>null</c>: not provided, do not touch the existing value.</item>
///   <item>non-null non-empty string: set the field to that value.</item>
///   <item>empty string: explicit clear (sets the field to null on the aggregate).</item>
/// </list>
/// The endpoint distinguishes "not provided" from "empty" using the JSON serialiser
/// (a missing key stays <c>null</c> in the request DTO; an explicit <c>""</c> survives).
/// </para>
/// </summary>
public sealed record EditReviewCommand(
    Guid ReviewId,
    Guid UserId,
    int? DifficultyRating,
    int? OverallRating,
    int? HoursPerWeek,
    bool HoursPerWeekProvided,
    IReadOnlyList<string>? Tags,
    bool? WouldRecommendCourse,
    bool? WouldRetakeTeacher,
    string? SubjectText,
    bool SubjectTextProvided,
    string? TeacherText,
    bool TeacherTextProvided,
    decimal? FinalGrade,
    bool FinalGradeProvided);
