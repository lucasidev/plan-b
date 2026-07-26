namespace Planb.Planning.Application.Features.ShareSimulationDraft;

/// <summary>Id + visibilidad resultante del borrador tras compartirlo.</summary>
public sealed record ShareSimulationDraftResponse(Guid Id, string Visibility);
