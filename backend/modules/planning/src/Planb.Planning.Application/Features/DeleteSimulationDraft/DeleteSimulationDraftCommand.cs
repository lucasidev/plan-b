namespace Planb.Planning.Application.Features.DeleteSimulationDraft;

/// <summary>Comando de US-023 (borrar un borrador propio, hard delete).</summary>
public sealed record DeleteSimulationDraftCommand(Guid UserId, Guid DraftId);
