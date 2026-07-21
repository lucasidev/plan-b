namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>Body de POST /api/me/simulator/evaluate. El userId sale del JWT, no del body.</summary>
public sealed record EvaluateSimulationRequest(IReadOnlyList<Guid> SubjectIds);
