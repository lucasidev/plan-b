namespace Planb.Planning.Application.Features.UnshareSimulationDraft;

/// <summary>Comando de US-024 (dejar de compartir un borrador propio, vuelve a privado).</summary>
public sealed record UnshareSimulationDraftCommand(Guid UserId, Guid DraftId);
