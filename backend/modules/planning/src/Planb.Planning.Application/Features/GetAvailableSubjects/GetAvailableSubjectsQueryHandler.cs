using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Handler de US-016 (lado "available"). Flow:
/// <list type="number">
///   <item>Resolver el <c>StudentProfileSummary</c> activo del user (cross-BC via
///         <see cref="IIdentityQueryService"/>). Sin profile activo → NotFound.</item>
///   <item>Traer el snapshot crudo del plan (materias activas, correlativas, progreso) vía
///         <see cref="ISimulatorAvailabilityReader"/>.</item>
///   <item>Delegar la decisión de disponibilidad a <c>ISubjectAvailabilityEvaluator</c> (domain
///         service puro, ya testeado): esto acá solo junta datos y arma la respuesta HTTP.</item>
///   <item>Zippear cada evaluación con la metadata de display de su materia, y resolver
///         <c>blockedBy</c> a code/name (no solo ids) buscando en el mismo snapshot.</item>
/// </list>
/// </summary>
public static class GetAvailableSubjectsQueryHandler
{
    public static async Task<Result<AvailableSubjectsResponse>> Handle(
        GetAvailableSubjectsQuery query,
        IIdentityQueryService identity,
        ISimulatorAvailabilityReader reader,
        ISubjectAvailabilityEvaluator evaluator,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(query.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return AvailabilityErrors.StudentProfileRequired;
        }

        var snapshot = await reader.GetPlanSnapshotAsync(profile.CareerPlanId, profile.Id, ct);

        var planSubjectIds = snapshot.Subjects.Select(s => s.Id).ToList();
        var evaluations = evaluator.Evaluate(
            planSubjectIds, snapshot.Prerequisites, snapshot.ProgressBySubject);

        // 1:1 con planSubjectIds (el evaluador devuelve exactamente una entrada por id de entrada),
        // así que el indexer de abajo (evaluationBySubject[subject.Id]) no puede fallar.
        var evaluationBySubject = evaluations.ToDictionary(e => e.SubjectId);

        // Materias activas del plan indexadas por id: sirve para resolver blockedBy a code/name.
        // Academic no deja archivar una materia mientras algo la tenga como correlativa
        // (DeactivateSubjectCommandHandler, 409 has_dependents) ni crear una correlativa cross-plan
        // (academic.prerequisite.cross_plan), así que todo RequiredSubjectId que el evaluador
        // devuelva en BlockedBy está garantizado activo y de este mismo plan: siempre aparece acá.
        var subjectsById = snapshot.Subjects.ToDictionary(s => s.Id);

        var items = snapshot.Subjects
            .Select(subject => ToItem(subject, evaluationBySubject[subject.Id], subjectsById))
            .ToList();

        return new AvailableSubjectsResponse(items);
    }

    private static AvailableSubjectItem ToItem(
        SimulatorSubjectSnapshot subject,
        SubjectAvailability evaluation,
        IReadOnlyDictionary<Guid, SimulatorSubjectSnapshot> subjectsById)
    {
        var blockedBy = evaluation.BlockedBy
            .Select(requiredSubjectId => subjectsById[requiredSubjectId])
            .Select(required => new BlockedBySubjectItem(required.Id, required.Code, required.Name))
            .ToList();

        return new AvailableSubjectItem(
            subject.Id,
            subject.Code,
            subject.Name,
            subject.YearInPlan,
            subject.TermInYear,
            subject.TermKind,
            subject.WeeklyHours,
            subject.TotalHours,
            evaluation.Status.ToString(),
            blockedBy);
    }
}
