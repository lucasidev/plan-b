namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Body de POST /api/me/simulator/evaluate. El userId sale del JWT, no del body.
/// <see cref="Commissions"/> es opcional (US-096): ver <see cref="EvaluateSimulationCommand"/>.
/// </summary>
public sealed record EvaluateSimulationRequest(
    IReadOnlyList<Guid> SubjectIds,
    IReadOnlyList<CommissionChoice>? Commissions = null);
