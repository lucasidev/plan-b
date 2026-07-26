namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Comisión elegida por el alumno para una materia de la combinación (US-096). Opcional en
/// <see cref="EvaluateSimulationCommand"/>: sin elegir ninguna, el simulador se comporta como antes
/// de US-096 (sin <c>Schedule</c> ni <c>Clashes</c> en la respuesta). <see cref="SubjectId"/> tiene
/// que estar entre los <see cref="EvaluateSimulationCommand.SubjectIds"/> de la misma request, y
/// <see cref="CommissionId"/> tiene que ser una comisión activa de esa materia: el handler valida
/// las tres cosas (ver <c>EvaluationErrors</c>).
/// </summary>
public sealed record CommissionChoice(Guid SubjectId, Guid CommissionId);
