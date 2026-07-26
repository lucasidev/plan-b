namespace Planb.Planning.Application.Features.ShareSimulationDraft;

/// <summary>Comando de US-024 (compartir un borrador propio al corpus público).</summary>
public sealed record ShareSimulationDraftCommand(Guid UserId, Guid DraftId);
