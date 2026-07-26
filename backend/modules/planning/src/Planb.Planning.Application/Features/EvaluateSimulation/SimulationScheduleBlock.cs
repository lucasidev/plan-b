namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Un bloque horario de una comisión elegida en el simulador (US-096), listo para display.
/// </summary>
/// <param name="Clashing">
/// True si este bloque participa de al menos un choque contra otra comisión elegida (mismo día,
/// rangos que se intersectan): ver <c>Planb.Planning.Domain.Schedule.ScheduleClashDetector</c> para
/// la regla exacta.
/// </param>
public sealed record SimulationScheduleBlock(
    Guid SubjectId,
    string SubjectCode,
    Guid CommissionId,
    string CommissionName,
    string Day,
    string Start,
    string End,
    bool Clashing);
