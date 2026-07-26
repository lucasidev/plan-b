namespace Planb.Planning.Application.Features.CreateSimulationDraft;

/// <summary>Body del POST /api/me/simulations/drafts (US-023).</summary>
public sealed record CreateSimulationDraftRequest(
    Guid TermId,
    string? Label,
    IReadOnlyList<CreateSimulationDraftItemRequest> Items);

/// <summary>Materia del body: comisión elegida opcional.</summary>
public sealed record CreateSimulationDraftItemRequest(Guid SubjectId, Guid? CommissionId);
