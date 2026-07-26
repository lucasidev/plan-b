namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Materia de una simulación pública (US-027), ya resuelta a code/name (+ nombre de la comisión
/// elegida, si hay): mismo shape que <c>SimulationDraftListItemSubject</c> del listado propio, para
/// que el frontend reuse el mismo componente de "chip de materia" en ambas pantallas.
/// </summary>
public sealed record PublicSimulationSubjectItem(
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    Guid? CommissionId,
    string? CommissionName);
