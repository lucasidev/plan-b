using Planb.Planning.Application.Features.GetAvailableSubjects;

namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Snapshot crudo de una comisión puntual por id (US-096): lo mínimo que el handler de evaluate
/// necesita para validar una <see cref="CommissionChoice"/> (a qué materia pertenece, si está
/// activa) y armar sus bloques de horario para la detección de choques. A diferencia de
/// <c>AvailableCommissionItem</c> (que arma el catálogo completo para display), no trae modalidad,
/// capacidad ni docentes: el handler de evaluate no los necesita.
/// </summary>
public sealed record CommissionScheduleSnapshot(
    Guid SubjectId,
    string Name,
    bool IsActive,
    IReadOnlyList<SimulatorScheduleItem> Schedule);
