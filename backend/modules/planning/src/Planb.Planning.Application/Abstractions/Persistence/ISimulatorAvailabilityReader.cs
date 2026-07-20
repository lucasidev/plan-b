using Planb.Planning.Application.Features.GetAvailableSubjects;

namespace Planb.Planning.Application.Abstractions.Persistence;

/// <summary>
/// Read-side cross-schema del simulador (US-016). Junta, para un plan + alumno puntuales, todo lo
/// que <c>ISubjectAvailabilityEvaluator</c> necesita para decidir disponibilidad: las materias
/// activas del plan, las correlativas y el progreso del alumno por materia.
///
/// <para>
/// La implementación (Dapper, en Infrastructure) cruza los schemas <c>academic</c> y
/// <c>enrollments</c> directo en SQL, sin referenciar el Domain de ninguno de los dos módulos
/// (ADR-0017): el acoplamiento es a nivel de columnas, no de tipos. Mismo criterio que
/// <c>IBrowseReviewsQueryService</c> en Reviews.
/// </para>
/// </summary>
public interface ISimulatorAvailabilityReader
{
    Task<SimulatorPlanSnapshot> GetPlanSnapshotAsync(
        Guid careerPlanId, Guid studentProfileId, CancellationToken ct = default);
}
