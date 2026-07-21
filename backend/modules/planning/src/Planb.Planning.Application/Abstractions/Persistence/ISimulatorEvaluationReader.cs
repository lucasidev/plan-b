using Planb.Planning.Application.Features.EvaluateSimulation;

namespace Planb.Planning.Application.Abstractions.Persistence;

/// <summary>
/// Read-side cross-schema de las métricas de "evaluate" (US-016) que no salen del snapshot de
/// disponibilidad: dificultad ponderada por reseñas (schema <c>reviews</c>) y estadística de
/// combinaciones históricas cursadas por otros alumnos (schema <c>enrollments</c>, self-join).
///
/// <para>
/// Mismo criterio que <c>ISimulatorAvailabilityReader</c>: Dapper cruzando schemas ajenos en SQL
/// parametrizado, sin referenciar el Domain de Reviews ni Enrollments (ADR-0017). El acoplamiento
/// es a nivel de columnas, no de tipos.
/// </para>
/// </summary>
public interface ISimulatorEvaluationReader
{
    /// <summary>
    /// Promedio de <c>difficulty_rating</c> de las reseñas <c>Published</c> ancladas (vía su
    /// enrollment) a cualquiera de <paramref name="subjectIds"/>. Null si ninguna materia tiene
    /// reseñas: "no sabemos" no es lo mismo que "fácil" (0).
    ///
    /// <para>
    /// Es un promedio simple sobre todas las reseñas de las materias juntas, no un promedio de
    /// promedios por materia: eso ya pondera por cantidad de reseñas de cada una (una con 30
    /// reseñas pesa 30 veces más que una con 1 sola) sin necesitar una segunda pasada en C#.
    /// </para>
    /// </summary>
    Task<double?> GetWeightedDifficultyAsync(
        IReadOnlyCollection<Guid> subjectIds, CancellationToken ct = default);

    /// <summary>
    /// Cuántos otros alumnos cursaron exactamente <paramref name="subjectIds"/> (mismo conjunto,
    /// sin importar orden) en un mismo término, y cómo les fue. Excluye a
    /// <paramref name="excludingStudentProfileId"/>: no tiene sentido comparar al alumno consigo
    /// mismo.
    /// </summary>
    Task<CombinationCohortStats> GetCombinationCohortStatsAsync(
        IReadOnlyCollection<Guid> subjectIds,
        Guid excludingStudentProfileId,
        CancellationToken ct = default);
}
