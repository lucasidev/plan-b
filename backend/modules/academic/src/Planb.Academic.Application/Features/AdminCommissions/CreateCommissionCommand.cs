using Planb.Academic.Domain.Commissions;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Alta de una comisión de una materia en un cuatrimestre (US-093, admin). Modality/role/day/time ya
/// llegan parseados a tipos fuertes: el endpoint hace el Enum.TryParse / TimeOnly.TryParseExact antes
/// de armar el command (patrón SubjectEnumParsing). La coherencia cross-aggregate (subject activo,
/// term existe, mismo term_kind, misma universidad de subject/term/docentes, nombre único por
/// subject+term) la valida el handler (ADR-0017: no hay FK cross-schema).
/// </summary>
public sealed record CreateCommissionCommand(
    Guid SubjectId,
    Guid TermId,
    string Name,
    CommissionModality Modality,
    int? Capacity,
    string? Notes,
    IReadOnlyList<CreateCommissionTeacherItem> Teachers,
    IReadOnlyList<CreateCommissionScheduleItem> Schedule);

/// <summary>Docente a asignar al crear la comisión (US-093): id + rol ya parseado a enum.</summary>
public sealed record CreateCommissionTeacherItem(Guid TeacherId, CommissionTeacherRole Role);

/// <summary>Franja horaria a cargar al crear la comisión (US-093): día + horas ya parseados.</summary>
public sealed record CreateCommissionScheduleItem(DayOfWeek Day, TimeOnly Start, TimeOnly End);
