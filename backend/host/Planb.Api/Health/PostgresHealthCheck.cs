using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Planb.Api.Metrics;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Api.Health;

/// <summary>
/// Abre una conexión con la misma factory que usan las lecturas Dapper y corre <c>SELECT 1</c>.
/// Timeout de 3 segundos enlazado al token del framework: sin él, una Postgres que no responde (en
/// vez de rechazar la conexión) deja el healthcheck colgado indefinidamente.
///
/// <para>
/// Cada corrida también deja su resultado en <c>dependency_up{dependency="postgres"}</c>
/// (<see cref="DependencyUpMetric"/>): es lo que hace visible en Prometheus una Postgres caída sin
/// tener que ir a leer <c>/health</c> a mano.
/// </para>
/// </summary>
internal sealed class PostgresHealthCheck : IHealthCheck
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    private readonly IDbConnectionFactory _connectionFactory;

    public PostgresHealthCheck(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(Timeout);

        var stopwatch = Stopwatch.StartNew();
        try
        {
            await using var connection = _connectionFactory.Create();
            await connection.OpenAsync(cts.Token);

            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            await command.ExecuteScalarAsync(cts.Token);

            DependencyUpMetric.Set("postgres", up: true);
            return HealthCheckResult.Healthy(data: new Dictionary<string, object>
            {
                ["latencyMs"] = stopwatch.ElapsedMilliseconds,
            });
        }
        catch (Exception ex)
        {
            DependencyUpMetric.Set("postgres", up: false);
            return HealthCheckResult.Unhealthy(ex.Message, ex);
        }
    }
}
