namespace Planb.Planning.Application.Features.UpdateSimulationDraft;

/// <summary>Body del PATCH /api/me/simulations/drafts/{id} (US-023).</summary>
public sealed record UpdateSimulationDraftRequest(
    string? Label,
    IReadOnlyList<UpdateSimulationDraftItemRequest> Items);

/// <summary>Materia del body: comisión elegida opcional.</summary>
public sealed record UpdateSimulationDraftItemRequest(Guid SubjectId, Guid? CommissionId);
