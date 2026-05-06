namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Read-side de Academic exportado a otros bounded contexts (ADR-0017: cross-BC reads via
/// Contracts, no FK Postgres ni nav properties EF cross-schema).
///
/// La interface se mantiene mínima. Cada método nuevo debe responder a un caller real
/// (no preventivo) para evitar exponer queries que después nadie usa pero quedan como
/// superficie de mantenimiento.
/// </summary>
public interface IAcademicQueryService
{
    /// <summary>Existe un CareerPlan con ese Id en el catálogo Academic?</summary>
    Task<bool> CareerPlanExistsAsync(Guid careerPlanId, CancellationToken ct = default);

    /// <summary>
    /// Devuelve un summary del CareerPlan + su Career padre (necesario en US-012 para que el
    /// StudentProfile pueda persistir el careerId derivado del plan, sin tener que hacer un
    /// segundo round-trip).
    /// </summary>
    Task<CareerPlanSummary?> GetCareerPlanByIdAsync(Guid careerPlanId, CancellationToken ct = default);

    /// <summary>
    /// Lista todas las universidades del catálogo. Para el dropdown público de US-037
    /// (onboarding cascada). Sin paginación: el catálogo MVP tiene &lt; 10 unis y crece poco.
    /// Cuando exceda ~50, agregar paginación.
    /// </summary>
    Task<IReadOnlyList<UniversityListItem>> ListUniversitiesAsync(CancellationToken ct = default);

    /// <summary>
    /// Lista las carreras de una universidad. Para el segundo dropdown de la cascada
    /// (US-037). Devuelve lista vacía si la uni no existe (no 404 — el caller ya validó la
    /// uni en el dropdown previo, una uni inválida es input adversarial y devolver vacío es
    /// correcto sin filtrar info).
    /// </summary>
    Task<IReadOnlyList<CareerListItem>> ListCareersByUniversityAsync(
        Guid universityId, CancellationToken ct = default);

    /// <summary>
    /// Lista los planes de una carrera. Tercer dropdown de la cascada (US-037). Mismo
    /// criterio que ListCareersByUniversityAsync: lista vacía para career inexistente.
    /// El caller filtra Status = 'current' del lado cliente (no acá, para que un futuro
    /// admin puede ver planes deprecated).
    /// </summary>
    Task<IReadOnlyList<CareerPlanListItem>> ListCareerPlansByCareerAsync(
        Guid careerId, CancellationToken ct = default);
}
