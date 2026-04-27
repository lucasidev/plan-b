using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using StackExchange.Redis;

namespace Planb.Identity.Infrastructure.Security;

/// <summary>
/// Redis-backed refresh token revocation list. Implements Patrón #1 of
/// <c>docs/architecture/redis-key-patterns.md</c>.
///
/// Key shape: <c>identity:refresh:{tokenHash}</c> with the userId as value and the token's
/// remaining lifetime as TTL. The stored hash is SHA-256 of the raw token, hex-encoded —
/// the raw token never reaches Redis, and Redis never reaches Postgres.
///
/// Failure mode: if Redis is unavailable, all read operations return null (token treated as
/// revoked) and write operations log a warning. Per ADR-0034 this is fail-safe for refresh —
/// users get a 401 and re-login.
/// </summary>
public sealed class RedisRefreshTokenStore : IRefreshTokenStore
{
    private const string KeyPrefix = "identity:refresh:";

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisRefreshTokenStore> _log;

    public RedisRefreshTokenStore(
        IConnectionMultiplexer redis,
        ILogger<RedisRefreshTokenStore> log)
    {
        _redis = redis;
        _log = log;
    }

    public async Task StoreAsync(
        string refreshToken,
        UserId userId,
        DateTimeOffset expiresAt,
        CancellationToken ct = default)
    {
        var ttl = expiresAt - DateTimeOffset.UtcNow;
        if (ttl <= TimeSpan.Zero) return;

        try
        {
            var db = _redis.GetDatabase();
            await db.StringSetAsync(KeyFor(refreshToken), userId.Value.ToString(), expiry: ttl);
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex,
                "Redis unavailable when storing refresh token. Token cannot be validated later — user will be forced to re-authenticate.");
            // Don't throw: the sign-in succeeded, the access token is valid for its own TTL.
            // Refresh just won't work; user will re-login when access expires. Acceptable.
        }
    }

    public async Task<UserId?> FindUserAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;

        try
        {
            var db = _redis.GetDatabase();
            var value = await db.StringGetAsync(KeyFor(refreshToken));
            if (value.IsNullOrEmpty) return null;
            if (!Guid.TryParse(value.ToString(), out var id)) return null;
            return new UserId(id);
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex, "Redis unavailable when validating refresh token; treating as revoked.");
            return null;
        }
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;

        try
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(KeyFor(refreshToken));
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex,
                "Redis unavailable when revoking refresh token. Token may remain valid until its TTL.");
        }
    }

    /// <summary>
    /// Hex-encoded SHA-256 of the raw token. Stable for a given input, irreversible without
    /// the original. Uses lowercase hex so equality checks are deterministic.
    /// </summary>
    private static string KeyFor(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        var hash = Convert.ToHexString(bytes).ToLowerInvariant();
        return KeyPrefix + hash;
    }
}
