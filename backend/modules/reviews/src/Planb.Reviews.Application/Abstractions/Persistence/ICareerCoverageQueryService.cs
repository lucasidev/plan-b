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

    /// <summary>
    /// Qué materias de un plan puntual ya tienen una cátedra que cruzó el piso (V10: la lista de
    /// materias del plan no marca cuáles tienen ficha). Mismo criterio de "medida" que
    /// <see cref="GetCoverageAsync"/>, pero acotado a un plan (no a los planes activos de una
    /// carrera) porque el caller ya está parado sobre una materia de ESE plan.
    /// </summary>
    Task<IReadOnlyList<Guid>> GetCoveredSubjectIdsAsync(
        Guid careerPlanId, int minimumReviews, CancellationToken ct = default);

    /// <summary>
    /// La cobertura y las voces de varias carreras en un solo viaje (US-222): lo que el catálogo de
    /// Explorar necesita para decir, antes del clic, dónde hay algo para leer, sin pedir estos
    /// números carrera por carrera. Mismo criterio de "medida" que <see cref="GetCoverageAsync"/>
    /// (plan vigente, piso por cátedra): <see cref="CareerCoverageBatch.VoiceCount"/> también
    /// respeta el piso, sumando solo lo que aportan las cátedras que lo cruzaron. Lo que hay debajo
    /// no desaparece del todo: <see cref="CareerCoverageBatch.HasReviewsBelowFloor"/> dice que existe,
    /// sin decir cuánto.
    ///
    /// <para>
    /// Devuelve una entrada solo para las carreras que tienen materias en su plan vigente: una
    /// carrera sin plan cargado no tiene nada que medir y el caller la completa con cero.
    /// </para>
    /// </summary>
    Task<IReadOnlyDictionary<Guid, CareerCoverageBatch>> GetCoverageBatchAsync(
        IReadOnlyCollection<Guid> careerIds, int minimumReviews, CancellationToken ct = default);
}

/// <summary>
/// Una entrada del batch de <see cref="ICareerCoverageQueryService.GetCoverageBatchAsync"/>: los
/// mismos M/N de <see cref="CareerCoverage"/> más las voces, publicadas nomás (piso por cátedra).
/// </summary>
public sealed record CareerCoverageBatch(
    int TotalSubjects,
    int CoveredSubjects,
    int VoiceCount,
    /// <summary>
    /// Hay al menos una cátedra de la carrera con reseñas cargadas que todavía no cruzan su piso:
    /// existe actividad aunque <see cref="VoiceCount"/> no la sume. Distingue "nadie reseñó" de
    /// "están reseñando, todavía no publica", sin exponer cuántas son.
    /// </summary>
    bool HasReviewsBelowFloor);

/// <summary>
/// M (<see cref="TotalSubjects"/>) son las materias del plan vigente de la carrera; N
/// (<see cref="CoveredSubjects"/>) las que tienen al menos una cátedra que llegó al piso. No decide
/// todavía qué frena la cursada: eso necesita el grafo de correlativas, y no es parte de esta
/// ficha.
/// </summary>
public sealed record CareerCoverage(int TotalSubjects, int CoveredSubjects);
