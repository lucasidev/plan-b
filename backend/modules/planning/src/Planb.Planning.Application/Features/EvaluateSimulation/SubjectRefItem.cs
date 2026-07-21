namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Referencia liviana a una materia (US-016): id, code y name, sin nada de disponibilidad. Se
/// reusa para dos roles dentro de <see cref="EvaluateSimulationResponse"/>: la materia bloqueada
/// del subset y cada correlativa que le falta (mismo shape que <c>BlockedBySubjectItem</c> de
/// GetAvailableSubjects, pero sin acoplar ambos features entre sí).
/// </summary>
public sealed record SubjectRefItem(Guid Id, string Code, string Name);
