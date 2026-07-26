using Planb.Planning.Application.Features.ListPublicSimulations;

namespace Planb.Planning.Application.Abstractions.Persistence;

/// <summary>
/// Read-side de US-027 (feed público de simulaciones compartidas). Cross-schema (Dapper, en
/// Infrastructure): cruza <c>planning.simulation_drafts</c> con <c>identity.student_profiles</c>
/// (para filtrar por el CareerPlanId del owner sin exponerlo) y con <c>academic.subjects</c>,
/// <c>academic.commissions</c>, <c>reviews.reviews</c> y <c>enrollments.enrollment_records</c> para
/// resolver composición y métricas. Mismo criterio que <c>ISimulationDraftListReader</c> /
/// <c>ISimulatorEvaluationReader</c> (ADR-0017): sin referenciar el Domain de esos módulos.
/// </summary>
public interface IPublicSimulationsReader
{
    /// <summary>
    /// Página de simulaciones <c>Shared</c> del <paramref name="careerPlanId"/> +
    /// <paramref name="termId"/> pedidos, ordenada por <c>shared_at DESC</c> (empate por <c>id</c>
    /// DESC para un orden total determinístico). Paginación keyset: sin cursor (ambos parámetros
    /// null) trae desde el principio; con <paramref name="cursorSharedAt"/> /
    /// <paramref name="cursorId"/> sigue estrictamente después del último item que ya vio el
    /// caller. <paramref name="limit"/> lo decide el handler (pageSize+1, para saber si hay más
    /// página sin una query de COUNT aparte).
    /// </summary>
    Task<IReadOnlyList<PublicSimulationDraftRow>> ListSharedAsync(
        Guid careerPlanId,
        Guid termId,
        DateTimeOffset? cursorSharedAt,
        Guid? cursorId,
        int limit,
        CancellationToken ct = default);
}
