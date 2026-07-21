namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Evalúa disponibilidad materia por materia (US-016).
///
/// <para>
/// La regla la fija el AC y viene de ADR-0003: una materia está disponible cuando **todas** sus
/// correlativas <c>para_cursar</c> están regularizadas o aprobadas. Las <c>para_rendir</c> no entran:
/// condicionan rendir el final, no inscribirse a cursar, y meterlas acá bloquearía materias que el
/// alumno sí puede cursar.
/// </para>
/// </summary>
public sealed class SubjectAvailabilityEvaluator : ISubjectAvailabilityEvaluator
{
    public IReadOnlyList<SubjectAvailability> Evaluate(
        IReadOnlyCollection<Guid> planSubjectIds,
        IReadOnlyCollection<PrerequisiteEdge> prerequisites,
        IReadOnlyDictionary<Guid, SubjectProgress> progressBySubject)
    {
        ArgumentNullException.ThrowIfNull(planSubjectIds);
        ArgumentNullException.ThrowIfNull(prerequisites);
        ArgumentNullException.ThrowIfNull(progressBySubject);

        var requiredToEnroll = BuildToEnrollIndex(prerequisites);
        var result = new List<SubjectAvailability>(planSubjectIds.Count);

        foreach (var subjectId in planSubjectIds)
        {
            var progress = ProgressOf(subjectId, progressBySubject);

            // Lo que el alumno ya cursó no se vuelve a ofrecer, sin importar las correlativas.
            // Reprobada y Abandonada sí siguen ofreciéndose: puede recursarlas.
            var settled = progress switch
            {
                SubjectProgress.Approved => AvailabilityStatus.AlreadyPassed,
                SubjectProgress.Regular => AvailabilityStatus.AlreadyRegularized,
                SubjectProgress.InProgress => AvailabilityStatus.InProgress,
                _ => (AvailabilityStatus?)null,
            };

            if (settled is { } status)
            {
                result.Add(new SubjectAvailability(subjectId, status, []));
                continue;
            }

            var missing = MissingPrerequisites(subjectId, requiredToEnroll, progressBySubject);

            result.Add(missing.Count == 0
                ? new SubjectAvailability(subjectId, AvailabilityStatus.Available, [])
                : new SubjectAvailability(subjectId, AvailabilityStatus.Blocked, missing));
        }

        return result;
    }

    private static Dictionary<Guid, List<Guid>> BuildToEnrollIndex(
        IReadOnlyCollection<PrerequisiteEdge> prerequisites)
    {
        var index = new Dictionary<Guid, List<Guid>>();

        foreach (var edge in prerequisites)
        {
            if (edge.Kind != PrerequisiteKind.ToEnroll)
            {
                continue;
            }

            if (!index.TryGetValue(edge.SubjectId, out var required))
            {
                required = [];
                index[edge.SubjectId] = required;
            }

            required.Add(edge.RequiredSubjectId);
        }

        return index;
    }

    /// <summary>
    /// Correlativas que le faltan. Una correlativa está cumplida si la tiene regularizada o
    /// aprobada: regularizar habilita a cursar la siguiente aunque el final siga pendiente.
    /// </summary>
    private static List<Guid> MissingPrerequisites(
        Guid subjectId,
        Dictionary<Guid, List<Guid>> requiredToEnroll,
        IReadOnlyDictionary<Guid, SubjectProgress> progressBySubject)
    {
        if (!requiredToEnroll.TryGetValue(subjectId, out var required))
        {
            return [];
        }

        var missing = new List<Guid>();

        foreach (var requiredSubjectId in required)
        {
            if (!Fulfils(ProgressOf(requiredSubjectId, progressBySubject)))
            {
                missing.Add(requiredSubjectId);
            }
        }

        return missing;
    }

    private static bool Fulfils(SubjectProgress progress) =>
        progress is SubjectProgress.Regular or SubjectProgress.Approved;

    private static SubjectProgress ProgressOf(
        Guid subjectId,
        IReadOnlyDictionary<Guid, SubjectProgress> progressBySubject) =>
        progressBySubject.TryGetValue(subjectId, out var progress)
            ? progress
            : SubjectProgress.NotStarted;
}
