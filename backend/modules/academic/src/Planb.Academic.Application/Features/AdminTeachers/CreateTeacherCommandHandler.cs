using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Handler del POST /api/academic/teachers (admin). Valida que la universidad exista en el catálogo
/// antes de crear el aggregate (no hay FK cross-schema; la integridad se enforce acá).
/// </summary>
public static class CreateTeacherCommandHandler
{
    public static async Task<Result<CreateTeacherResponse>> Handle(
        CreateTeacherCommand command,
        ITeacherRepository teachers,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (!await academic.UniversityExistsAsync(command.UniversityId, ct))
        {
            return TeacherErrors.UniversityNotFound;
        }

        var result = Teacher.Create(
            new UniversityId(command.UniversityId),
            command.FirstName,
            command.LastName,
            command.Title,
            command.Bio,
            command.PhotoUrl,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await teachers.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateTeacherResponse(result.Value.Id.Value);
    }
}
