namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// POST /api/me/simulator/evaluate (US-016). Evalúa una combinación de materias del alumno
/// logueado: valida que sea viable (todas del plan, ninguna bloqueada) y computa sus métricas.
/// No persiste nada (ADR-0029): llega como POST porque el subset de materias no entra en una
/// query string, pero es una consulta de lectura, igual que GetAvailableSubjects.
/// </summary>
public sealed record EvaluateSimulationCommand(Guid UserId, IReadOnlyList<Guid> SubjectIds);
