using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.ChangePassword;

/// <summary>
/// Handler del cambio de contraseña con sesión activa (US-079-i). Distinto al
/// <see cref="ResetPassword.ResetPasswordCommandHandler"/> que consume un token de email: este
/// flow verifica la <c>currentPassword</c> + rotaal hash + revoca refresh tokens.
///
/// <para>
/// <b>Decisión de scope</b>: revocamos TODOS los refresh tokens del user (incluido el del
/// session actual), no "todos excepto el actual" como dice el AC original. El user va a tener
/// que re-loguearse en este dispositivo también después de cambiar la password. Razones:
/// </para>
/// <list type="bullet">
///   <item>Mismo comportamiento que <see cref="ResetPassword.ResetPasswordCommandHandler"/>:
///         consistencia entre los dos flows de cambio de contraseña.</item>
///   <item>Más seguro: no asumimos que el session actual no fue comprometido (caso típico:
///         user cambia password porque sospecha que le hackearon la cuenta).</item>
///   <item>Sin scope creep: extender <c>IRefreshTokenStore</c> con un método nuevo +
///         actualizar el adapter Redis + tests sería un PR aparte. Cuando aterrice, este handler
///         se actualiza trivial.</item>
/// </list>
///
/// <para>
/// El integration event <c>UserPasswordChanged</c> (para que el módulo Notifications mande email
/// "Tu contraseña se cambió") se emite vía Wolverine outbox automáticamente al persistir el
/// domain event <c>UserPasswordChangedDomainEvent</c> + ser proyectado a integration event
/// (cuando aterrice US-077-b backend de notifications). Por ahora solo el domain event.
/// </para>
/// </summary>
public static class ChangePasswordCommandHandler
{
    public static async Task<Result> Handle(
        ChangePasswordCommand command,
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IPasswordHasher passwords,
        IRefreshTokenStore refreshTokens,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByIdAsync(command.UserId, ct);
        if (user is null)
        {
            // Estado degenerado: el JWT decía un userId que no existe (user borrado
            // mid-session). Devolvemos invalid credentials para no leakear info.
            return UserErrors.PasswordCurrentInvalid;
        }

        var changeResult = user.ChangePassword(
            command.CurrentPassword,
            command.NewPassword,
            verifyHash: existingHash => passwords.Verify(command.CurrentPassword, existingHash),
            hashPassword: passwords.Hash,
            clock);

        if (changeResult.IsFailure)
        {
            return changeResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        // Revoke después del SaveChanges, igual que ResetPassword: best-effort, si Redis no
        // responde el access token vence por su JWT clock y el próximo refresh attempt 401.
        await refreshTokens.RevokeAllForUserAsync(user.Id, ct);

        return Result.Success();
    }
}
