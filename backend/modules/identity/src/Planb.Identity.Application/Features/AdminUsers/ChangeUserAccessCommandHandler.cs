using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.AdminUsers;

public static class ChangeUserAccessCommandHandler
{
    public static async Task<Result> Handle(ChangeUserAccessCommand command,
        IUserRepository users, IRefreshTokenStore refreshTokens,
        IDomainEventPublisher publisher, IDateTimeProvider clock, CancellationToken ct)
    {
        if (command.Suspend && (string.IsNullOrWhiteSpace(command.Reason) || command.Reason.Length > 500))
        {
            return Error.Validation("identity.users.invalid_reason", "A reason of 1 to 500 characters is required.");
        }
        var user = await users.FindByIdAsync(command.UserId, ct);
        if (user is null || user.IsDeactivated || user.IsExpired)
        {
            return UserErrors.NotFoundById;
        }
        // Esta pantalla administra alumnos. Los accesos del equipo requieren su propio contrato.
        if (user.Role != UserRole.Member || user.Id.Value == command.ActorId)
        {
            return Error.Forbidden("identity.users.member_required", "Only member accounts can be managed here.");
        }
        var expectedAccessVersion = user.AccessVersion;
        var result = command.Suspend
            ? user.Disable(command.ActorId, command.Reason!.Trim(), clock)
            : user.Restore(clock);
        if (result.IsFailure) return result;

        // El estado leído debe seguir vigente: otro administrador puede haberlo cambiado.
        if (!await users.TryUpdateAccessAsync(user, expectedAccessVersion, ct))
        {
            return Error.Conflict("identity.users.access_changed", "Account access changed. Reload and retry.");
        }
        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await refreshTokens.RevokeAllForUserAsync(user.Id, ct);
        return Result.Success();
    }
}
