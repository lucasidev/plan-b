using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Features.GetAvailableSubjects;
using Planb.Planning.Domain.Availability;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Handler de US-016 (lado "evaluate"). Flow:
/// <list type="number">
///   <item>Resolver el <c>StudentProfile</c> activo del user (cross-BC via
///         <see cref="IIdentityQueryService"/>). Sin profile activo → NotFound.</item>
///   <item>Traer el mismo snapshot que usa GetAvailableSubjects (<see cref="ISimulatorAvailabilityReader"/>):
///         materias activas del plan, correlativas y progreso. Es el mismo dato, así que la
///         evaluación de disponibilidad es consistente entre los dos endpoints del simulador.</item>
///   <item>Si alguna materia del subset no aparece en el snapshot (no es del plan, o está
///         archivada), cortar con <see cref="EvaluationErrors.SubjectNotInPlan"/>.</item>
///   <item>Reevaluar disponibilidad con el mismo <c>ISubjectAvailabilityEvaluator</c> que
///         GetAvailableSubjects. Si alguna materia del subset viene Blocked, la respuesta viaja
///         con <c>IsValid=false</c> y el detalle de qué correlativa le falta a cada una (mismo
///         shape que <c>blockedBy</c> en /available); ninguna métrica se computa.</item>
///   <item>Si el subset es viable: sumar carga horaria de las materias elegidas, y pedirle al
///         <see cref="ISimulatorEvaluationReader"/> (Dapper cross-schema con Reviews/Enrollments)
///         la dificultad ponderada y las estadísticas de la cohorte.</item>
/// </list>
/// </summary>
public static class EvaluateSimulationCommandHandler
{
    public static async Task<Result<EvaluateSimulationResponse>> Handle(
        EvaluateSimulationCommand command,
        IIdentityQueryService identity,
        ISimulatorAvailabilityReader availabilityReader,
        ISimulatorEvaluationReader evaluationReader,
        ISubjectAvailabilityEvaluator evaluator,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return AvailabilityErrors.StudentProfileRequired;
        }

        // El AC pide "sin importar orden"; distinct por si el caller repite un id sin querer.
        var requestedIds = command.SubjectIds.Distinct().ToList();

        var snapshot = await availabilityReader.GetPlanSnapshotAsync(
            profile.CareerPlanId, profile.Id, ct);
        var subjectsById = snapshot.Subjects.ToDictionary(s => s.Id);

        if (requestedIds.Any(id => !subjectsById.ContainsKey(id)))
        {
            return EvaluationErrors.SubjectNotInPlan;
        }

        var planSubjectIds = snapshot.Subjects.Select(s => s.Id).ToList();
        var evaluationBySubject = evaluator
            .Evaluate(planSubjectIds, snapshot.Prerequisites, snapshot.ProgressBySubject)
            .ToDictionary(e => e.SubjectId);

        var blocked = requestedIds
            .Select(id => evaluationBySubject[id])
            .Where(evaluation => evaluation.Status == AvailabilityStatus.Blocked)
            .Select(evaluation => ToBlockedItem(subjectsById[evaluation.SubjectId], evaluation, subjectsById))
            .ToList();

        if (blocked.Count > 0)
        {
            return new EvaluateSimulationResponse(
                IsValid: false,
                BlockedSubjects: blocked,
                TotalWeeklyHours: 0,
                TotalHours: 0,
                WeightedDifficulty: null,
                CombinationStats: new CombinationCohortStats(0, null, null));
        }

        var selectedSubjects = requestedIds.Select(id => subjectsById[id]).ToList();
        var totalWeeklyHours = selectedSubjects.Sum(s => s.WeeklyHours);
        var totalHours = selectedSubjects.Sum(s => s.TotalHours);

        var weightedDifficulty = await evaluationReader.GetWeightedDifficultyAsync(requestedIds, ct);
        var cohortStats = await evaluationReader.GetCombinationCohortStatsAsync(
            requestedIds, profile.Id, ct);

        return new EvaluateSimulationResponse(
            IsValid: true,
            BlockedSubjects: [],
            TotalWeeklyHours: totalWeeklyHours,
            TotalHours: totalHours,
            WeightedDifficulty: weightedDifficulty,
            CombinationStats: cohortStats);
    }

    private static BlockedSubjectItem ToBlockedItem(
        SimulatorSubjectSnapshot subject,
        SubjectAvailability evaluation,
        IReadOnlyDictionary<Guid, SimulatorSubjectSnapshot> subjectsById)
    {
        var blockedBy = evaluation.BlockedBy
            .Select(requiredSubjectId => subjectsById[requiredSubjectId])
            .Select(required => new SubjectRefItem(required.Id, required.Code, required.Name))
            .ToList();

        return new BlockedSubjectItem(subject.Id, subject.Code, subject.Name, blockedBy);
    }
}
