using Planb.Academic.Domain.Commissions;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Edición de una comisión (US-093, admin). Replace del form completo salvo subject/term (no se
/// pueden mover, mismo criterio que <c>Subject.Update</c> no tocando CareerPlanId). Docentes:
/// re-sincroniza todo (desasigna los actuales y asigna los nuevos) en vez de diffear altas/bajas
/// puntuales; horario: <see cref="Commission.ReplaceSchedule"/> ya trabaja así (manda la grilla
/// completa).
/// </summary>
public sealed record UpdateCommissionCommand(
    Guid CommissionId,
    string Name,
    CommissionModality Modality,
    int? Capacity,
    string? Notes,
    IReadOnlyList<UpdateCommissionTeacherItem> Teachers,
    IReadOnlyList<UpdateCommissionScheduleItem> Schedule);

/// <summary>Docente a asignar al editar la comisión (US-093): id + rol ya parseado a enum.</summary>
public sealed record UpdateCommissionTeacherItem(Guid TeacherId, CommissionTeacherRole Role);

/// <summary>Franja horaria a cargar al editar la comisión (US-093): día + horas ya parseados.</summary>
public sealed record UpdateCommissionScheduleItem(DayOfWeek Day, TimeOnly Start, TimeOnly End);
