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
    // Los dos ejes de texto de la reseña. El aggregate exige al menos uno, no los dos, así que
    // cualquiera de ellos puede venir null. Hasta ahora el feed solo traía SubjectText y la página
    // del docente lo renderizaba como si fuera la opinión sobre él: el lector creía estar leyendo
    // una cosa y leía otra.
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade,
    DateTime CreatedAt,
    // UpdatedAt > CreatedAt marca que la reseña se editó, igual que ResponseUpdatedAt del lado del
    // docente. La asimetría importaba: la respuesta del docente exponía sus ediciones y la reseña
    // no, así que el autor podía reescribir el texto después de que le respondieran y dejar la
    // respuesta contestando algo que ya no está escrito, sin que el lector tuviera cómo notarlo.
    DateTime UpdatedAt,
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
