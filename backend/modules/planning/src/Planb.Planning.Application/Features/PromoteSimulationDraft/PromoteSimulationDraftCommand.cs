namespace Planb.Planning.Application.Features.PromoteSimulationDraft;

/// <summary>Comando de US-023 (promover/publicar un borrador propio a plan Active del término).</summary>
public sealed record PromoteSimulationDraftCommand(Guid UserId, Guid DraftId);
