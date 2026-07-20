namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Decide qué materias del plan puede cursar el alumno el próximo período, cruzando las correlativas
/// con su historial (US-016).
///
/// <para>
/// Sin I/O, igual que <c>IPrerequisiteGraphValidator</c>: el caller trae el plan, el grafo y el
/// progreso, y esto decide. Así la regla que más le importa al alumno ("¿puedo anotarme a esto?")
/// se testea sin base de datos.
/// </para>
/// </summary>
public interface ISubjectAvailabilityEvaluator
{
    /// <param name="planSubjectIds">Todas las materias del plan del alumno.</param>
    /// <param name="prerequisites">Las correlativas del plan (los dos tipos; el evaluador filtra).</param>
    /// <param name="progressBySubject">
    /// Progreso del alumno por materia. Las materias que no figuran se tratan como
    /// <see cref="SubjectProgress.NotStarted"/>.
    /// </param>
    IReadOnlyList<SubjectAvailability> Evaluate(
        IReadOnlyCollection<Guid> planSubjectIds,
        IReadOnlyCollection<PrerequisiteEdge> prerequisites,
        IReadOnlyDictionary<Guid, SubjectProgress> progressBySubject);
}
