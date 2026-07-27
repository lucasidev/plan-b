using System.Globalization;
using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Features.GetAvailableSubjects;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Schedule;
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
///   <item>US-096: validar <see cref="EvaluateSimulationCommand.Commissions"/> (si vino alguna):
///         cada choice tiene que apuntar a una materia del subset, y a una comisión que exista,
///         pertenezca a esa materia y esté activa. Cualquier violación corta con un
///         <c>Result.Failure</c> (ver <see cref="EvaluationErrors"/>).</item>
///   <item>Reevaluar disponibilidad con el mismo <c>ISubjectAvailabilityEvaluator</c> que
///         GetAvailableSubjects. Si alguna materia del subset viene Blocked, la respuesta viaja
///         con <c>IsValid=false</c> y el detalle de qué correlativa le falta a cada una (mismo
///         shape que <c>blockedBy</c> en /available); ninguna métrica se computa (incluido el
///         horario: <c>Schedule</c> vacío, <c>Clashes</c> null).</item>
///   <item>Si el subset es viable: sumar carga horaria de las materias elegidas, pedirle al
///         <see cref="ISimulatorEvaluationReader"/> (Dapper cross-schema con Reviews/Enrollments)
///         la dificultad ponderada y las estadísticas de la cohorte, y armar el horario de las
///         comisiones elegidas detectando choques (US-096, <see cref="ScheduleClashDetector"/>).</item>
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

        var choices = command.Commissions ?? [];
        var commissionsValidation = await ValidateCommissionChoicesAsync(
            choices, requestedIds, availabilityReader, ct);
        if (commissionsValidation.IsFailure)
        {
            return commissionsValidation.Error;
        }
        var commissionsById = commissionsValidation.Value;

        var planSubjectIds = snapshot.Subjects.Select(s => s.Id).ToList();
        var evaluationBySubject = evaluator
            .Evaluate(planSubjectIds, snapshot.Prerequisites, snapshot.ProgressBySubject)
            .ToDictionary(e => e.SubjectId);

        var blocked = requestedIds
            .Select(id => evaluationBySubject[id])
            .Where(evaluation => evaluation.Status == AvailabilityStatus.Blocked)
            .Select(evaluation => ToBlockedItem(subjectsById[evaluation.SubjectId], evaluation, subjectsById))
            .ToList();

        // Las horas se computan antes del corte por bloqueo a propósito: son una suma del catálogo,
        // no una consulta, así que se saben igual. Antes viajaban en 0 y eso afirmaba "0 horas
        // semanales" sobre una combinación de, por ejemplo, 24.
        var selectedSubjects = requestedIds.Select(id => subjectsById[id]).ToList();
        var totalWeeklyHours = selectedSubjects.Sum(s => s.WeeklyHours);
        var totalHours = selectedSubjects.Sum(s => s.TotalHours);

        if (blocked.Count > 0)
        {
            // La cohorte va null, no en 0: la query nunca corrió. Un SampleSize 0 acá decía
            // "ningún alumno cursó esta combinación", que es una medición que no se hizo. El 0 real
            // (la query corrió y no encontró a nadie) sigue siendo 0 en el camino válido.
            return new EvaluateSimulationResponse(
                IsValid: false,
                BlockedSubjects: blocked,
                TotalWeeklyHours: totalWeeklyHours,
                TotalHours: totalHours,
                WeightedDifficulty: null,
                CombinationStats: null,
                Schedule: [],
                Clashes: null);
        }

        var weightedDifficulty = await evaluationReader.GetWeightedDifficultyAsync(requestedIds, ct);
        var cohortStats = await evaluationReader.GetCombinationCohortStatsAsync(
            requestedIds, profile.Id, profile.CareerPlanId, ct);

        var (scheduleBlocks, clashes) = BuildScheduleAndClashes(choices, commissionsById, subjectsById);

        return new EvaluateSimulationResponse(
            IsValid: true,
            BlockedSubjects: [],
            TotalWeeklyHours: totalWeeklyHours,
            TotalHours: totalHours,
            WeightedDifficulty: weightedDifficulty,
            CombinationStats: cohortStats,
            Schedule: scheduleBlocks,
            Clashes: clashes);
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

    /// <summary>
    /// US-096: valida cada <see cref="CommissionChoice"/> en el orden que documenta
    /// <see cref="EvaluationErrors"/>: primero que la materia esté en <paramref name="requestedIds"/>
    /// (in-memory, sin ir a la base), después que la comisión exista, pertenezca a esa materia y
    /// esté activa (requiere el fetch a <see cref="ISimulatorAvailabilityReader"/>). Sin choices,
    /// devuelve un diccionario vacío sin ir a la base.
    /// </summary>
    private static async Task<Result<IReadOnlyDictionary<Guid, CommissionScheduleSnapshot>>>
        ValidateCommissionChoicesAsync(
            IReadOnlyList<CommissionChoice> choices,
            IReadOnlyList<Guid> requestedIds,
            ISimulatorAvailabilityReader availabilityReader,
            CancellationToken ct)
    {
        if (choices.Count == 0)
        {
            return Result.Success<IReadOnlyDictionary<Guid, CommissionScheduleSnapshot>>(
                new Dictionary<Guid, CommissionScheduleSnapshot>());
        }

        var requestedIdSet = requestedIds.ToHashSet();
        if (choices.Any(choice => !requestedIdSet.Contains(choice.SubjectId)))
        {
            return EvaluationErrors.CommissionSubjectNotRequested;
        }

        var commissionIds = choices.Select(c => c.CommissionId).Distinct().ToList();
        var commissionsById = await availabilityReader.GetCommissionSchedulesByIdAsync(commissionIds, ct);

        foreach (var choice in choices)
        {
            if (!commissionsById.TryGetValue(choice.CommissionId, out var commission))
            {
                return EvaluationErrors.CommissionNotFound;
            }

            if (commission.SubjectId != choice.SubjectId)
            {
                return EvaluationErrors.CommissionSubjectMismatch;
            }

            if (!commission.IsActive)
            {
                return EvaluationErrors.CommissionInactive;
            }
        }

        // Todas del mismo período. El comando no recibe el término, y antes tampoco se validaba
        // contra ninguno: se podían mezclar la comisión de una materia de 2026-1c con la de otra de
        // 2024-2c y la detección de choques corría igual, sobre una grilla que nunca va a existir.
        //
        // Se deriva el período de las comisiones en lugar de pedirlo en el body: el dato ya viene
        // adentro de cada comisión, así que agregarlo al contrato seria pedirle al cliente algo que
        // el servidor ya sabe, y encima confiable solo si el cliente no miente.
        if (commissionsById.Values.Select(c => c.TermId).Distinct().Count() > 1)
        {
            return EvaluationErrors.CommissionsSpanMultipleTerms;
        }

        return Result.Success(commissionsById);
    }

    /// <summary>
    /// US-096: arma los bloques de horario de las comisiones elegidas y detecta choques entre
    /// comisiones de materias distintas (<see cref="ScheduleClashDetector"/>, domain puro de
    /// Planning). Sin ninguna comisión elegida, devuelve <c>Schedule</c> vacío y <c>Clashes</c>
    /// null: "no sabemos" no es lo mismo que "cero choques" (mismo criterio que
    /// <see cref="EvaluateSimulationResponse.WeightedDifficulty"/>).
    /// </summary>
    private static (IReadOnlyList<SimulationScheduleBlock> Schedule, int? Clashes) BuildScheduleAndClashes(
        IReadOnlyList<CommissionChoice> choices,
        IReadOnlyDictionary<Guid, CommissionScheduleSnapshot> commissionsById,
        IReadOnlyDictionary<Guid, SimulatorSubjectSnapshot> subjectsById)
    {
        if (choices.Count == 0)
        {
            return ([], null);
        }

        var blocks = choices
            .SelectMany(choice => commissionsById[choice.CommissionId].Schedule
                .Select(slot => new ScheduledBlock(
                    choice.SubjectId,
                    choice.CommissionId,
                    Enum.Parse<DayOfWeek>(slot.Day),
                    TimeOnly.ParseExact(slot.Start, "HH:mm", CultureInfo.InvariantCulture),
                    TimeOnly.ParseExact(slot.End, "HH:mm", CultureInfo.InvariantCulture))))
            .ToList();

        var clashes = ScheduleClashDetector.Detect(blocks);

        var scheduleItems = blocks
            .Select(block =>
            {
                var commission = commissionsById[block.CommissionId];
                var subject = subjectsById[block.SubjectId];

                // Clashing = participa de al menos un choque: el bloque clasha si su propio rango
                // intersecta la ventana de solape de algún ScheduleClash donde su materia aparece
                // (como primera o segunda). Comparar contra la ventana de solape (no solo el día)
                // desambigua el caso de una comisión con más de un bloque el mismo día.
                var clashing = clashes.Any(c =>
                    (c.FirstSubjectId == block.SubjectId || c.SecondSubjectId == block.SubjectId)
                    && c.Day == block.Day
                    && c.OverlapStart < block.End && block.Start < c.OverlapEnd);

                return new SimulationScheduleBlock(
                    block.SubjectId,
                    subject.Code,
                    block.CommissionId,
                    commission.Name,
                    block.Day.ToString(),
                    block.Start.ToString("HH:mm", CultureInfo.InvariantCulture),
                    block.End.ToString("HH:mm", CultureInfo.InvariantCulture),
                    clashing);
            })
            .ToList();

        return (scheduleItems, clashes.Count);
    }
}
