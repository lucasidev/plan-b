namespace Planb.Reviews.Application.Features.TeacherInsights;

/// <summary>
/// Crowd insights agregados sobre las reseñas Published donde un docente fue el reseñado (US-003).
/// Misma forma que los insights de materia, computados en una query Dapper sobre los campos de
/// US-089. Se duplica el shape (en vez de compartir el de materia) para no acoplar los dos reads:
/// el de materia agrega por <c>enrollment.subject_id</c>, este por <c>docente_resenado_id</c>.
///
/// <para>
/// Sin reseñas Published para el docente, <see cref="TotalCount"/> es 0 y los promedios son
/// <c>null</c> (el caller muestra el empty state). El histograma siempre trae 5 posiciones.
/// </para>
/// </summary>
public sealed record TeacherReviewInsights(
    int TotalCount,
    double? AverageOverallRating,
    double? AverageDifficulty,
    double? AverageHoursPerWeek,
    double? RecommendPercentage,
    IReadOnlyList<int> RatingHistogram);
