namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Fila del listado global de comisiones de un cuatrimestre, cross-materia (US-093 cont.), para la
/// pantalla "Comisiones · cuatri" del backoffice. A diferencia de <see cref="AdminCommissionListItem"/>
/// (comisiones de UNA materia), este listado mezcla comisiones de materias distintas, por eso incluye
/// SubjectId/SubjectCode/SubjectName. Reusa <see cref="AdminCommissionTeacherItem"/> y
/// <see cref="AdminCommissionScheduleItem"/>: son las mismas filas hijas, solo cambia el nivel de
/// agregación (todo el término en vez de una materia).
/// </summary>
public sealed record TermCommissionListItem(
    Guid CommissionId,
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    string Name,
    string Modality,
    int? Capacity,
    bool IsActive,
    IReadOnlyList<AdminCommissionTeacherItem> Teachers,
    IReadOnlyList<AdminCommissionScheduleItem> Schedule);

/// <summary>Wrapper del listado global de comisiones de un término (US-093 cont.).</summary>
public sealed record TermCommissionListResponse(IReadOnlyList<TermCommissionListItem> Items);
