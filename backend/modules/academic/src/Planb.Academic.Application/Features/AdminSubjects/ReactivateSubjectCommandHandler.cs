using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Handler del POST /api/academic/subjects/{id}/reactivate (admin). 404 si no existe; 409 si ya
/// estaba activa (idempotencia explícita del aggregate).
/// </summary>
public static class ReactivateSubjectCommandHandler
{
    public static async Task<Result<SubjectStatusResponse>> Handle(
        ReactivateSubjectCommand command,
        ISubjectRepository subjects,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subject = await subjects.GetByIdAsync(new SubjectId(command.SubjectId), ct);
        if (subject is null)
        {
            return SubjectErrors.NotFound;
        }

        var result = subject.Reactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new SubjectStatusResponse(subject.Id.Value, subject.IsActive);
    }
}
