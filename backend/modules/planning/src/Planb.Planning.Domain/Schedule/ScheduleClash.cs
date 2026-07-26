namespace Planb.Planning.Domain.Schedule;

/// <summary>
/// Un choque de horario detectado entre dos <see cref="ScheduledBlock"/> de comisiones distintas
/// (US-096): mismo día, con rangos que se intersectan. <see cref="OverlapStart"/> y
/// <see cref="OverlapEnd"/> son la intersección real de los dos rangos (nunca vacía:
/// <see cref="ScheduleClashDetector"/> solo emite un <see cref="ScheduleClash"/> cuando el solape
/// existe de verdad).
/// </summary>
public sealed record ScheduleClash(
    Guid FirstSubjectId, Guid SecondSubjectId, DayOfWeek Day, TimeOnly OverlapStart, TimeOnly OverlapEnd);
