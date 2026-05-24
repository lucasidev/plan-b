using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.UpdateMyProfile;

/// <summary>
/// Handler del PATCH /api/me/student-profile (US-047). Carga el User aggregate, delega el
/// edit al método del dominio (que valida invariantes y aplica el patch al StudentProfile
/// activo), y persiste.
/// </summary>
public static class UpdateMyProfileCommandHandler
{
    public static async Task<Result> Handle(
        UpdateMyProfileCommand command,
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByIdAsync(command.UserId, ct);
        if (user is null)
        {
            return UserErrors.NotFoundById;
        }

        var updateResult = user.UpdateActiveStudentProfile(
            command.DisplayName,
            command.YearOfStudy,
            command.Legajo,
            command.RegularStudent,
            clock);

        if (updateResult.IsFailure)
        {
            return updateResult.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
