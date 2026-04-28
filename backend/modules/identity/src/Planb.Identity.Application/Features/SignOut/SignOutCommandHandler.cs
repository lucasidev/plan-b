using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Application.Features.SignOut;

/// <summary>
/// Sign-out handler. Revokes the refresh token in the Redis revocation list (Patrón #1 of
/// ADR-0034) so any future call to /api/identity/refresh with the same token gets a 401.
///
/// No <see cref="Planb.SharedKernel.Primitives.Result{T}"/> wrapping: sign-out is idempotent
/// — calling it without a token, with an unknown token, or with one already revoked all
/// produce the same outcome (the refresh is gone). The endpoint always returns 204.
///
/// The access cookie isn't tracked server-side (it's a self-contained JWT). The endpoint
/// clears it client-side by overwriting the cookie with an expired one; nothing for this
/// handler to do for the access path.
/// </summary>
public static class SignOutCommandHandler
{
    public static async Task Handle(
        SignOutCommand command,
        IRefreshTokenStore refreshTokens,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken)) return;
        await refreshTokens.RevokeAsync(command.RefreshToken, ct);
    }
}
