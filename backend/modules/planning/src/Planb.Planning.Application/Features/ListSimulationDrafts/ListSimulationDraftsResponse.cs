namespace Planb.Planning.Application.Features.ListSimulationDrafts;

/// <summary>Respuesta del GET /api/me/simulations/drafts.</summary>
public sealed record ListSimulationDraftsResponse(IReadOnlyList<SimulationDraftListItem> Items);
