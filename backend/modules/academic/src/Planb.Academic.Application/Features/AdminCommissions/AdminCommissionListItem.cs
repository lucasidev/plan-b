namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Fila del listado admin de comisiones de una materia+término (US-093), con docentes y horario
/// completos. A diferencia de <c>AdminSubjectListItem</c>, no es property-init: Teachers/Schedule son
/// colecciones hijas, así que el reader Dapper la arma a mano (dos queries planas + agrupado en
/// memoria) en vez de un mapeo 1:1 fila-a-record.
/// </summary>
public sealed record AdminCommissionListItem(
    Guid Id,
    string Name,
    string Modality,
    int? Capacity,
    string? Notes,
    bool IsActive,
    IReadOnlyList<AdminCommissionTeacherItem> Teachers,
    IReadOnlyList<AdminCommissionScheduleItem> Schedule);

/// <summary>Un docente asignado a la comisión, con su rol (string PascalCase del enum).</summary>
public sealed record AdminCommissionTeacherItem(
    Guid TeacherId, string FirstName, string LastName, string Role);

/// <summary>Una franja horaria de la comisión, con día y horas como strings de display.</summary>
public sealed record AdminCommissionScheduleItem(string Day, string Start, string End);
