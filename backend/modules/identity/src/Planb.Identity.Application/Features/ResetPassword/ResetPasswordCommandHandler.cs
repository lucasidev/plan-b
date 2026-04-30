using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.ResetPassword;

/// <summary>
/// Handles the password-reset confirmation. Unlike forgot-password, this handler does NOT
/// hide failure modes: invalid / expired / consumed / wrong-purpose tokens, weak passwords,
/// disabled accounts all surface as distinct errors so the frontend can render specific
/// copy. The token came from the user's mailbox, so revealing "expired" doesn't leak
/// anything an attacker who already has it doesn't already know.
///
/// Successful resets fire <c>RevokeAllForUserAsync</c> against the refresh token store so
/// any session opened with the previous password (whether legitimate or by an attacker
/// with a stolen refresh) is forced to re-login. The token itself is consumed inside the
/// aggregate, so a replay returns <c>identity.verification.already_consumed</c>.
/// </summary>
public static class ResetPasswordCommandHandler
{
    public static async Task<Result> Handle(
        ResetPasswordCommand command,
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IPasswordHasher passwords,
        IRefreshTokenStore refreshTokens,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByRawVerificationTokenAsync(command.Token, ct);
        if (user is null)
        {
            return UserErrors.VerificationTokenInvalid;
        }

        var resetResult = user.ResetPassword(
            command.Token, command.NewPassword, passwords.Hash, clock);
        if (resetResult.IsFailure)
        {
            return resetResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        // Revoke after persistence so we don't kill sessions for a write that ended up
        // rolled back. The store treats this as best-effort; if Redis is down the access
        // tokens still expire on their own JWT clock and the next refresh attempt 401s.
        await refreshTokens.RevokeAllForUserAsync(user.Id, ct);

        return Result.Success();
    }
}
