namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// POST /api/me/simulator/evaluate (US-016). Evalúa una combinación de materias del alumno
/// logueado: valida que sea viable (todas del plan, ninguna bloqueada) y computa sus métricas.
/// No persiste nada (ADR-0029): llega como POST porque el subset de materias no entra en una
/// query string, pero es una consulta de lectura, igual que GetAvailableSubjects.
///
/// <para>
/// <see cref="Commissions"/> es opcional (US-096): la comisión que el alumno eligió para cada
/// materia de la combinación, para calcular el horario semanal y detectar choques. Sin elegir
/// ninguna, el comportamiento es idéntico al de antes de US-096 (sin <c>Schedule</c> ni
/// <c>Clashes</c> en la respuesta).
/// </para>
/// </summary>
public sealed record EvaluateSimulationCommand(
    Guid UserId,
    IReadOnlyList<Guid> SubjectIds,
    IReadOnlyList<CommissionChoice>? Commissions);
