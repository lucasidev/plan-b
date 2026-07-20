using Planb.Planning.Domain.Availability;

namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Snapshot crudo de plan + alumno que arma <c>ISimulatorAvailabilityReader</c> (US-016): las
/// materias activas del plan (con su metadata de display), las correlativas ya traducidas a
/// <see cref="PrerequisiteEdge"/> y el progreso del alumno por materia ya traducido a
/// <see cref="SubjectProgress"/>. Es el input listo para <c>ISubjectAvailabilityEvaluator.Evaluate</c>
/// más la metadata de display que el evaluador no necesita pero la respuesta HTTP sí.
/// </summary>
public sealed record SimulatorPlanSnapshot(
    IReadOnlyList<SimulatorSubjectSnapshot> Subjects,
    IReadOnlyList<PrerequisiteEdge> Prerequisites,
    IReadOnlyDictionary<Guid, SubjectProgress> ProgressBySubject);
