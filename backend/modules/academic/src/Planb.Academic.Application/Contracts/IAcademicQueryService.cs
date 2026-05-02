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
}
