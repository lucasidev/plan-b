using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.Refresh;

public static class RefreshCommandHandler
{
    public static async Task<Result<RefreshResponse>> Handle(
        RefreshCommand command,
        IUserRepository users,
        IRefreshTokenStore refreshTokens,
        IJwtIssuer jwt,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
        {
            return UserErrors.InvalidCredentials;
        }

        var userId = await refreshTokens.FindUserAsync(command.RefreshToken, ct);
        if (userId is null)
        {
            // Token revoked, expired, or never issued — all indistinguishable on purpose.
            return UserErrors.InvalidCredentials;
        }

        var user = await users.FindByIdAsync(userId.Value, ct);
        if (user is null)
        {
            // Token referenced a user that no longer exists. Clean up the orphan.
            await refreshTokens.RevokeAsync(command.RefreshToken, ct);
            return UserErrors.InvalidCredentials;
        }

        // Block refresh from disabled / unverified users — they shouldn't keep extending sessions
        // even if they hold an old refresh token.
        if (user.IsDisabled) return UserErrors.AccountDisabled;
        if (!user.IsEmailVerified) return UserErrors.EmailNotVerified;

        // Token rotation: revoke the old refresh, issue a new pair. Reduces the window where a
        // leaked refresh token is useful.
        await refreshTokens.RevokeAsync(command.RefreshToken, ct);
        var fresh = jwt.IssueTokens(user);
        await refreshTokens.StoreAsync(
            fresh.RefreshToken, user.Id, fresh.RefreshTokenExpiresAt, ct);

        return new RefreshResponse(user.Id.Value, user.Email.Value, user.Role.ToString())
        {
            Tokens = fresh,
        };
    }
}
