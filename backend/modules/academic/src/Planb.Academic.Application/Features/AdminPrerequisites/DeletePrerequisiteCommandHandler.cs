using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Handler del DELETE /api/academic/subjects/{subjectId}/prerequisites/{requiredSubjectId}/{type}
/// (admin). Hard delete de la arista puntual: a diferencia de Subject/Career/University no hay soft
/// delete acá, la tripla identifica de forma unívoca la fila y no queda nada colgado al borrarla.
/// 404 si la correlativa no existe.
/// </summary>
public static class DeletePrerequisiteCommandHandler
{
    public static async Task<Result> Handle(
        DeletePrerequisiteCommand command,
        IPrerequisiteRepository prerequisites,
        IAcademicUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var subjectId = new SubjectId(command.SubjectId);
        var requiredSubjectId = new SubjectId(command.RequiredSubjectId);

        var prerequisite = await prerequisites.FindAsync(subjectId, requiredSubjectId, command.Type, ct);
        if (prerequisite is null)
        {
            return PrerequisiteErrors.NotFound;
        }

        prerequisites.Remove(prerequisite);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
