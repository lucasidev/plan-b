using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Handler del POST /api/academic/subjects/{subjectId}/prerequisites (admin). Orden de
/// validaciones, cada una con su propio error (US-062):
/// <list type="number">
///   <item>Las dos materias existen (404 <c>academic.subject.not_found</c>).</item>
///   <item>Ambas del mismo career plan (400 <c>academic.prerequisite.cross_plan</c>, invariante del
///         data-model: la tabla de correlativas no lleva career_plan_id propio).</item>
///   <item>No self-reference (400 <c>academic.prerequisite.self_reference</c>).</item>
///   <item>No duplicada, misma tripla (409 <c>academic.prerequisite.already_exists</c>).</item>
///   <item>No cierra ciclo en el grafo de ese type (409 <c>academic.prerequisite.cycle_detected</c>,
///         vía <see cref="IPrerequisiteGraphValidator"/> con el grafo completo del plan).</item>
/// </list>
///
/// <para>
/// Subject y Prerequisite viven en el mismo schema academic sin FK declarada (ADR-0017): la
/// existencia y el plan de cada materia se resuelven acá contra <see cref="IAcademicQueryService"/>,
/// mismo criterio que CreateAcademicTermCommandHandler valida la University antes de crear el term.
/// </para>
/// </summary>
public static class CreatePrerequisiteCommandHandler
{
    public static async Task<Result<CreatePrerequisiteResponse>> Handle(
        CreatePrerequisiteCommand command,
        IPrerequisiteRepository prerequisites,
        IPrerequisiteGraphValidator graphValidator,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subject = await academic.GetSubjectByIdAsync(command.SubjectId, ct);
        if (subject is null)
        {
            return SubjectErrors.NotFound;
        }

        var requiredSubject = await academic.GetSubjectByIdAsync(command.RequiredSubjectId, ct);
        if (requiredSubject is null)
        {
            return SubjectErrors.NotFound;
        }

        if (subject.CareerPlanId != requiredSubject.CareerPlanId)
        {
            return PrerequisiteErrors.CrossPlan;
        }

        if (command.SubjectId == command.RequiredSubjectId)
        {
            return PrerequisiteErrors.SelfReference;
        }

        var subjectId = new SubjectId(command.SubjectId);
        var requiredSubjectId = new SubjectId(command.RequiredSubjectId);

        if (await prerequisites.FindAsync(subjectId, requiredSubjectId, command.Type, ct) is not null)
        {
            return PrerequisiteErrors.AlreadyExists;
        }

        var careerPlanId = new CareerPlanId(subject.CareerPlanId);
        var existingInPlan = await prerequisites.GetByPlanAsync(careerPlanId, ct);

        var cycleCheck = graphValidator.ValidateNewEdge(
            subjectId, requiredSubjectId, command.Type, existingInPlan);
        if (cycleCheck.IsFailure)
        {
            return cycleCheck.Error;
        }

        var result = Prerequisite.Create(subjectId, requiredSubjectId, command.Type, clock.UtcNow);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await prerequisites.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreatePrerequisiteResponse(
            subjectId.Value, requiredSubjectId.Value, command.Type.ToString());
    }
}
