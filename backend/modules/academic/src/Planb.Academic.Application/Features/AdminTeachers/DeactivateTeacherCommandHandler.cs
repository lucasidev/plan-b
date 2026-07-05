using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Handler del DELETE /api/academic/teachers/{id} (admin). Soft delete vía <c>Deactivate</c>. 404 si
/// no existe; 409 si ya estaba inactivo (idempotencia explícita del aggregate).
/// </summary>
public static class DeactivateTeacherCommandHandler
{
    public static async Task<Result<TeacherStatusResponse>> Handle(
        DeactivateTeacherCommand command,
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

        var result = teacher.Deactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new TeacherStatusResponse(teacher.Id.Value, teacher.IsActive);
    }
}
