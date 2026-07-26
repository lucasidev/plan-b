namespace Planb.Planning.Domain.Schedule;

/// <summary>
/// Un bloque horario de una comisión elegida en el simulador (US-096), listo para detectar choques
/// contra los bloques de otras comisiones elegidas. <see cref="SubjectId"/> y
/// <see cref="CommissionId"/> identifican de qué materia y comisión es el bloque: dos bloques de la
/// MISMA comisión nunca "chocan" entre sí (el aggregate <c>Commission</c> de Academic ya garantiza
/// que las franjas de una comisión no se solapan entre ellas, ver <c>Commission.BuildScheduleSet</c>).
/// </summary>
public sealed record ScheduledBlock(Guid SubjectId, Guid CommissionId, DayOfWeek Day, TimeOnly Start, TimeOnly End);
