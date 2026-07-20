using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Handler del DELETE /api/academic/subjects/{id} (admin). Soft delete vía
/// <see cref="Subject.Deactivate"/>. 404 si no existe. Antes de desactivar, chequea que ninguna
/// otra materia del plan la declare correlativa
/// (<see cref="IPrerequisiteRepository.GetDependentsAsync"/>): si hay dependientes, no desactiva y
/// devuelve el listado resuelto (code + name) para que el admin las reasigne primero.
/// </summary>
public static class DeactivateSubjectCommandHandler
{
    public static async Task<Result<DeactivateSubjectResponse>> Handle(
        DeactivateSubjectCommand command,
        ISubjectRepository subjects,
        IPrerequisiteRepository prerequisites,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subject = await subjects.GetByIdAsync(new SubjectId(command.SubjectId), ct);
        if (subject is null)
        {
            return SubjectErrors.NotFound;
        }

        var dependents = await prerequisites.GetDependentsAsync(subject.Id, ct);
        if (dependents.Count > 0)
        {
            var items = new List<SubjectDependentItem>(dependents.Count);
            foreach (var dependent in dependents)
            {
                var dependentSubject = await subjects.GetByIdAsync(dependent.SubjectId, ct);
                if (dependentSubject is not null)
                {
                    items.Add(new SubjectDependentItem(
                        dependentSubject.Id.Value, dependentSubject.Code, dependentSubject.Name));
                }
            }

            return new DeactivateSubjectResponse(
                Deactivated: false, Code: SubjectErrors.HasDependents.Code, Dependents: items);
        }

        var result = subject.Deactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new DeactivateSubjectResponse(Deactivated: true, Code: null, Dependents: []);
    }
}
