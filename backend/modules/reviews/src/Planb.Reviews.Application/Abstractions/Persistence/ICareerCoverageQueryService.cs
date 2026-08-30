namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Cuánto de una carrera está medido (US-134): sobre las materias del plan vigente, cuántas tienen
/// al menos una cátedra que cruzó el piso de publicación.
///
/// <para>
/// Es el único read de Reviews que cruza a academic con SQL en vez de <c>IAcademicQueryService</c>
/// (ADR-0017 permite el JOIN cross-schema en lecturas Dapper para esta analítica): pedirlo vía
/// contratos, materia por materia, sería un N+1 por cada materia del plan; acá es un solo viaje.
/// </para>
/// </summary>
public interface ICareerCoverageQueryService
{
    Task<CareerCoverage> GetCoverageAsync(
        Guid careerId, int minimumReviews, CancellationToken ct = default);
}

/// <summary>
/// M (<see cref="TotalSubjects"/>) son las materias del plan vigente de la carrera; N
/// (<see cref="CoveredSubjects"/>) las que tienen al menos una cátedra que llegó al piso. No decide
/// todavía qué frena la cursada: eso necesita el grafo de correlativas, y no es parte de esta
/// ficha.
/// </summary>
public sealed record CareerCoverage(int TotalSubjects, int CoveredSubjects);
