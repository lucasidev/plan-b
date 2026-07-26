using Planb.Planning.Application.Features.EvaluateSimulation;
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

    /// <summary>
    /// Oferta de comisiones activas de <paramref name="termId"/> para <paramref name="subjectIds"/>
    /// (US-096, GET /available?termId=), con docentes y horario. Agrupada por subjectId: una
    /// materia sin comisiones en ese término simplemente no aparece como key (el caller resuelve con
    /// <c>GetValueOrDefault</c> a lista vacía).
    /// </summary>
    Task<IReadOnlyDictionary<Guid, IReadOnlyList<AvailableCommissionItem>>> GetCommissionOfferingsAsync(
        Guid termId, IReadOnlyCollection<Guid> subjectIds, CancellationToken ct = default);

    /// <summary>
    /// Snapshot crudo de comisiones puntuales por id (US-096, POST /evaluate con
    /// <c>CommissionChoice</c>): a qué materia pertenece cada una, si está activa, y su horario. Sin
    /// filtrar por activa (a diferencia de <see cref="GetCommissionOfferingsAsync"/>): el handler
    /// necesita distinguir "no existe" de "existe pero está inactiva" para devolver el error
    /// correcto.
    /// </summary>
    Task<IReadOnlyDictionary<Guid, CommissionScheduleSnapshot>> GetCommissionSchedulesByIdAsync(
        IReadOnlyCollection<Guid> commissionIds, CancellationToken ct = default);
}
