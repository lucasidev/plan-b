namespace Planb.Planning.Application.Features.PromoteSimulationDraft;

/// <summary>Id + estado resultante del borrador tras el promote.</summary>
public sealed record PromoteSimulationDraftResponse(Guid Id, string Status);
