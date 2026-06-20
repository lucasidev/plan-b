namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Metadata completa de una materia, por id. Caller: la página pública de materia (US-002),
/// que muestra code/name/año + carga horaria + descripción arriba de los agregados y la lista
/// de reseñas. Distinto de <see cref="SubjectListItem"/> (usado en selects del form de US-013):
/// este trae los campos de detalle (<see cref="WeeklyHours"/>, <see cref="TotalHours"/>,
/// <see cref="Description"/>) que el listado no necesita.
/// </summary>
public sealed record SubjectDetailItem(
    Guid Id,
    Guid CareerPlanId,
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    string TermKind,
    int WeeklyHours,
    int TotalHours,
    string? Description,
    bool IsOfficial);
