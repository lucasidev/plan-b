using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Security;

/// <summary>
/// Refresh token revocation list. Per ADR-0034 patrón #1 this lives in Redis: each issued
/// refresh token's SHA-256 hash gets a key with the user id as value and a TTL matching the
/// token's natural lifetime. Sign-out and password change DEL the key, immediately invalidating
/// the refresh token. Anything not present in the list is invalid.
///
/// Failure mode (Redis unreachable): per the ADR's degradation principle, validation falls
/// back to "not present" — the client gets 401 and must re-login. Better than failing open.
/// </summary>
public interface IRefreshTokenStore
{
    /// <summary>
    /// Stores a freshly issued refresh token's hash with the owning user.
    /// </summary>
    Task StoreAsync(string refreshToken, UserId userId, DateTimeOffset expiresAt, CancellationToken ct = default);

    /// <summary>
    /// Looks up the user a refresh token belongs to. Returns null if not present (revoked,
    /// expired, or never issued — all indistinguishable to the caller, which is the point).
    /// </summary>
    Task<UserId?> FindUserAsync(string refreshToken, CancellationToken ct = default);

    /// <summary>
    /// Revokes a single refresh token. Idempotent: deleting an absent key is a no-op.
    /// Used by sign-out.
    /// </summary>
    Task RevokeAsync(string refreshToken, CancellationToken ct = default);
}
