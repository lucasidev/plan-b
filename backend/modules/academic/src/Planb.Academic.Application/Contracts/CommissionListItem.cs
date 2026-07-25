namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Una comisión activa de una materia en un cuatrimestre, con sus docentes y horario (US-065,
/// US-093). Caller: el listado público de comisiones por materia + term (picker de la cursada y
/// página de materia/docente). <see cref="Modality"/> viene como string (PascalCase del enum). Los
/// nombres de docente vienen en title case listos para display (el storage es lowercase
/// normalizado).
/// </summary>
public sealed record CommissionListItem(
    Guid Id,
    string Name,
    string Modality,
    int? Capacity,
    IReadOnlyList<CommissionTeacherItem> Teachers,
    IReadOnlyList<CommissionScheduleItem> Schedules);

/// <summary>Un docente asignado a una comisión, con su rol (string PascalCase del enum).</summary>
public sealed record CommissionTeacherItem(
    Guid TeacherId,
    string FirstName,
    string LastName,
    string Role);

/// <summary>
/// Una franja horaria de cursada (US-093), con día y horas como strings de display (ej. "Monday",
/// "18:00"), listas para mostrar sin que el caller tenga que interpretar un DayOfWeek/TimeOnly crudo.
/// </summary>
public sealed record CommissionScheduleItem(string Day, string Start, string End);
