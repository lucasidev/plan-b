using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Handler del PATCH /api/academic/teachers/{id} (admin). Carga el aggregate, aplica Rename +
/// UpdateProfile y persiste. 404 si el docente no existe.
/// </summary>
public static class UpdateTeacherCommandHandler
{
    public static async Task<Result<UpdateTeacherResponse>> Handle(
        UpdateTeacherCommand command,
        ITeacherRepository teachers,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var teacher = await teachers.GetByIdAsync(new TeacherId(command.TeacherId), ct);
        if (teacher is null)
        {
            return TeacherErrors.NotFound;
        }

        var rename = teacher.Rename(command.FirstName, command.LastName, clock);
        if (rename.IsFailure)
        {
            return rename.Error;
        }

        var profile = teacher.UpdateProfile(command.Title, command.Bio, command.PhotoUrl, clock);
        if (profile.IsFailure)
        {
            return profile.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateTeacherResponse(teacher.Id.Value);
    }
}
