namespace Planb.Planning.Application.Features.CreateSimulationDraft;

/// <summary>
/// Comando de US-023 (guardar una simulación como borrador privado). El owner real es el
/// StudentProfile del user, no el UserId: el handler lo resuelve vía IIdentityQueryService antes de
/// crear el aggregate.
/// </summary>
public sealed record CreateSimulationDraftCommand(
    Guid UserId,
    Guid TermId,
    string? Label,
    IReadOnlyList<CreateSimulationDraftItemInput> Items);

/// <summary>Materia (+ comisión elegida opcional) del borrador a crear.</summary>
public sealed record CreateSimulationDraftItemInput(Guid SubjectId, Guid? CommissionId);
