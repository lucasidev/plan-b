namespace Planb.Reviews.Application.Features.SubjectInsights;

/// <summary>
/// Crowd insights agregados sobre las reseñas Published de una materia (US-002). Computados en
/// una sola query Dapper con <c>GROUP BY</c>/<c>FILTER</c> (sin N+1) sobre los campos que US-089
/// hizo persistibles (overall rating, dificultad, horas/semana, recomendación).
///
/// <para>
/// Cuando la materia no tiene reseñas Published, <see cref="TotalCount"/> es 0 y los promedios
/// son <c>null</c> (no 0: "0 de promedio" mentiría; el caller muestra el empty state). El
/// histograma siempre trae 5 posiciones (rating 1..5), en cero si no hay reseñas.
/// </para>
/// </summary>
public sealed record SubjectReviewInsights(
    int TotalCount,
    double? AverageOverallRating,
    double? AverageDifficulty,
    double? AverageHoursPerWeek,
    double? RecommendPercentage,
    IReadOnlyList<int> RatingHistogram);
