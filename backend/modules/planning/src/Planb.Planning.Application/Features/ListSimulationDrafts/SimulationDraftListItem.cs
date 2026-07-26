namespace Planb.Planning.Application.Features.ListSimulationDrafts;

/// <summary>
/// Borrador para el listado de "mis simulaciones" (US-023). Trae todos los estados
/// (Draft/Active/Archived): el frontend decide cómo agruparlos.
/// </summary>
public sealed record SimulationDraftListItem(
    Guid Id,
    Guid TermId,
    string? Label,
    string Status,
    IReadOnlyList<SimulationDraftListItemSubject> Items,
    DateTimeOffset CreatedAt);

/// <summary>
/// Materia del borrador ya resuelta a code/name (+ nombre de la comisión elegida, si hay), para que
/// el frontend pinte la lista sin pedir nada más por materia/comisión (evita N+1).
/// </summary>
public sealed record SimulationDraftListItemSubject(
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    Guid? CommissionId,
    string? CommissionName);
