namespace Planb.Planning.Application.Features.UnshareSimulationDraft;

/// <summary>Id + visibilidad resultante del borrador tras dejar de compartirlo.</summary>
public sealed record UnshareSimulationDraftResponse(Guid Id, string Visibility);
