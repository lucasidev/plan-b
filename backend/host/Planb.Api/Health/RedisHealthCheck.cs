using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Planb.Api.Metrics;
using StackExchange.Redis;

namespace Planb.Api.Health;

/// <summary>
/// PING contra Redis por el mismo <see cref="IConnectionMultiplexer"/> singleton que usan los
/// consumidores reales (refresh tokens, rate limiter). Mismo timeout y misma forma de resultado que
/// <see cref="PostgresHealthCheck"/>, incluida la escritura a
/// <c>dependency_up{dependency="redis"}</c> (<see cref="DependencyUpMetric"/>).
/// </summary>
internal sealed class RedisHealthCheck : IHealthCheck
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    private readonly IConnectionMultiplexer _connectionMultiplexer;

    public RedisHealthCheck(IConnectionMultiplexer connectionMultiplexer)
    {
        _connectionMultiplexer = connectionMultiplexer;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(Timeout);

        var stopwatch = Stopwatch.StartNew();
        try
        {
            // PingAsync no tiene overload con CancellationToken (StackExchange.Redis no lo soporta
            // en su protocolo); WaitAsync es lo que hace valer el timeout acá.
            await _connectionMultiplexer.GetDatabase().PingAsync().WaitAsync(cts.Token);

            DependencyUpMetric.Set("redis", up: true);
            return HealthCheckResult.Healthy(data: new Dictionary<string, object>
            {
                ["latencyMs"] = stopwatch.ElapsedMilliseconds,
            });
        }
        catch (Exception ex)
        {
            DependencyUpMetric.Set("redis", up: false);
            return HealthCheckResult.Unhealthy(ex.Message, ex);
        }
    }
}
