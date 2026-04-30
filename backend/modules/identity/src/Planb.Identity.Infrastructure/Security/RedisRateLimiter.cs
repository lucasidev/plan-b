using Microsoft.Extensions.Logging;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Abstractions.Clock;
using StackExchange.Redis;

namespace Planb.Identity.Infrastructure.Security;

/// <summary>
/// Sliding-window-log rate limiter on Redis sorted sets. Implements Patrón #2 of
/// <c>docs/architecture/redis-key-patterns.md</c>.
///
/// Per call (atomic via a single Lua EVAL):
/// <list type="number">
///   <item>ZREMRANGEBYSCORE drops entries older than <c>now - window</c>.</item>
///   <item>ZCARD reads the live count.</item>
///   <item>If under the ceiling, ZADD records the new attempt and returns allowed.</item>
///   <item>EXPIRE renews the key TTL to the window length so empty buckets self-clean.</item>
/// </list>
///
/// The script returns <c>{allowed, remainingAvailable}</c> so the caller doesn't need a
/// second roundtrip. Atomic execution prevents the classic check-then-act race where two
/// requests both see "1 left" and both ZADD past the ceiling.
///
/// Failure mode: on <see cref="RedisException"/> the limiter fails open with the full
/// budget reported as available, per the ADR-0034 patrón #2 fallback contract.
/// </summary>
public sealed class RedisRateLimiter : IRateLimiter
{
    /// <summary>
    /// Lua: KEYS[1] = bucket key. ARGV[1] = now ms, ARGV[2] = window ms, ARGV[3] = max,
    /// ARGV[4] = unique member (request id, "now-rand"). Returns <c>{allowed, remaining}</c>
    /// where allowed is 1/0 and remaining is "how many more attempts fit in the window
    /// after this call". When rejected, the script does NOT add the rejected attempt to
    /// the set, so spamming after exceeding the limit doesn't extend the lockout.
    /// </summary>
    private const string SlidingWindowScript = """
        local key       = KEYS[1]
        local now       = tonumber(ARGV[1])
        local windowMs  = tonumber(ARGV[2])
        local maxReq    = tonumber(ARGV[3])
        local member    = ARGV[4]

        redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
        local count = redis.call('ZCARD', key)

        if count >= maxReq then
            return {0, 0}
        end

        redis.call('ZADD', key, now, member)
        redis.call('PEXPIRE', key, windowMs)
        return {1, maxReq - count - 1}
        """;

    private readonly IConnectionMultiplexer _redis;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<RedisRateLimiter> _log;

    public RedisRateLimiter(
        IConnectionMultiplexer redis,
        IDateTimeProvider clock,
        ILogger<RedisRateLimiter> log)
    {
        _redis = redis;
        _clock = clock;
        _log = log;
    }

    public async Task<RateLimitResult> TryAcquireAsync(
        string key,
        TimeSpan window,
        int maxRequests,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Rate limit key must not be blank.", nameof(key));
        }
        if (window <= TimeSpan.Zero)
        {
            throw new ArgumentException("Window must be positive.", nameof(window));
        }
        if (maxRequests <= 0)
        {
            throw new ArgumentException("Max requests must be positive.", nameof(maxRequests));
        }

        try
        {
            var db = _redis.GetDatabase();
            var nowMs = _clock.UtcNow.ToUnixTimeMilliseconds();
            var windowMs = (long)window.TotalMilliseconds;
            // The member only needs to be unique within the window to avoid ZADD overwrite.
            // Using "{nowMs}-{guidN}" gives uniqueness even under microsecond bursts.
            var member = $"{nowMs}-{Guid.NewGuid():N}";

            var result = (RedisResult[]?)await db.ScriptEvaluateAsync(
                SlidingWindowScript,
                keys: [key],
                values: [nowMs, windowMs, maxRequests, member]);

            if (result is null || result.Length < 2)
            {
                _log.LogWarning(
                    "Rate limiter script returned an unexpected shape for key {Key}; failing open.", key);
                return new RateLimitResult(true, maxRequests);
            }

            var allowed = (long)result[0] == 1;
            var available = (int)(long)result[1];
            return new RateLimitResult(allowed, available);
        }
        catch (RedisException ex)
        {
            _log.LogWarning(ex,
                "Redis unavailable for rate limit check on {Key}; failing open.", key);
            return new RateLimitResult(true, maxRequests);
        }
    }
}
