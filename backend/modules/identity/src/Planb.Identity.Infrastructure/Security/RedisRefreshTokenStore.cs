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
/// Key shapes:
/// <list type="bullet">
///   <item>
///     <c>identity:refresh:{tokenHash}</c>: per-token entry with the userId as value and the
///     token's remaining lifetime as TTL. Stored hash is SHA-256 of the raw token, hex-encoded.
///   </item>
///   <item>
///     <c>identity:refresh-by-user:{userId}</c>: a SET of every active token hash for that user.
///     Lets <see cref="RevokeAllForUserAsync"/> nuke every refresh in O(N) without scanning the
///     keyspace. Each <c>StoreAsync</c> SADDs to it; <c>RevokeAsync</c> SREMs from it.
///   </item>
/// </list>
///
/// Failure mode: if Redis is unavailable, all read operations return null (token treated as
/// revoked) and write operations log a warning. Per ADR-0034 this is fail-safe for refresh:
/// users get a 401 and re-login.
/// </summary>
public sealed class RedisRefreshTokenStore : IRefreshTokenStore
{
    private const string KeyPrefix = "identity:refresh:";
    private const string UserIndexPrefix = "identity:refresh-by-user:";

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
            var hash = HashFor(refreshToken);
            var primaryKey = KeyPrefix + hash;
            var indexKey = UserIndexPrefix + userId.Value;

            // Pipeline: primary key + secondary-index SADD + EXPIRE on the index. Both keys
            // get the same TTL so the index never outlives its members. We renew the index TTL
            // on every Store so it always reflects "longest-lived token in the set".
            var batch = db.CreateBatch();
            var stringSet = batch.StringSetAsync(primaryKey, userId.Value.ToString(), expiry: ttl);
            var setAdd = batch.SetAddAsync(indexKey, hash);
            var indexExpire = batch.KeyExpireAsync(indexKey, ttl);
            batch.Execute();
            await Task.WhenAll(stringSet, setAdd, indexExpire);
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex,
                "Redis unavailable when storing refresh token. Token cannot be validated later, user will be forced to re-authenticate.");
        }
    }

    public async Task<UserId?> FindUserAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;

        try
        {
            var db = _redis.GetDatabase();
            var value = await db.StringGetAsync(KeyPrefix + HashFor(refreshToken));
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
            var hash = HashFor(refreshToken);
            var primaryKey = KeyPrefix + hash;

            // Look up the owner before deleting so we can clean up the index entry. If the
            // primary is already gone (idempotent re-call), there's nothing to remove from
            // the index either, the SREM is a no-op.
            var owner = await db.StringGetAsync(primaryKey);

            if (!owner.IsNullOrEmpty && Guid.TryParse(owner.ToString(), out var userId))
            {
                var batch = db.CreateBatch();
                var del = batch.KeyDeleteAsync(primaryKey);
                var srem = batch.SetRemoveAsync(UserIndexPrefix + userId, hash);
                batch.Execute();
                await Task.WhenAll(del, srem);
            }
            else
            {
                await db.KeyDeleteAsync(primaryKey);
            }
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex,
                "Redis unavailable when revoking refresh token. Token may remain valid until its TTL.");
        }
    }

    public async Task RevokeAllForUserAsync(UserId userId, CancellationToken ct = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var indexKey = UserIndexPrefix + userId.Value;

            var hashes = await db.SetMembersAsync(indexKey);
            if (hashes.Length == 0) return;

            // Build the list of primary keys to delete plus the index itself in one batch.
            var keys = new RedisKey[hashes.Length + 1];
            for (var i = 0; i < hashes.Length; i++)
            {
                keys[i] = KeyPrefix + hashes[i].ToString();
            }
            keys[hashes.Length] = indexKey;

            await db.KeyDeleteAsync(keys);
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex,
                "Redis unavailable when revoking all refresh tokens for user {UserId}. Tokens may remain valid until their TTL.",
                userId.Value);
        }
    }

    /// <summary>
    /// Hex-encoded SHA-256 of the raw token. Stable for a given input, irreversible without
    /// the original. Lowercase hex keeps equality checks deterministic.
    /// </summary>
    private static string HashFor(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
