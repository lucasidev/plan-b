namespace Planb.Planning.Application.Features.UpdateSimulationDraft;

/// <summary>
/// Comando de US-023 (editar un borrador existente). Reemplazo atómico de label + items, mismo
/// criterio que Commission.Reconfigure: valida todo antes de mutar.
/// </summary>
public sealed record UpdateSimulationDraftCommand(
    Guid UserId,
    Guid DraftId,
    string? Label,
    IReadOnlyList<UpdateSimulationDraftItemInput> Items);

/// <summary>Materia (+ comisión elegida opcional) del borrador tras la edición.</summary>
public sealed record UpdateSimulationDraftItemInput(Guid SubjectId, Guid? CommissionId);
