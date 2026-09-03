using System.Net;
using System.Net.Sockets;
using JasperFx.CommandLine;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Planb.Identity.Infrastructure.Persistence;
using Wolverine;
using Xunit;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Copia de <see cref="RegisterApiFixture"/> que apunta <c>ConnectionStrings:Redis</c> a un
/// puerto cerrado de localhost, para probar la degradación de ADR-0034: el host tiene que
/// arrancar igual (<c>AbortOnConnectFail=false</c> en Program.cs) y cada consumidor de Redis
/// tiene que degradar en vez de romper.
/// </summary>
public sealed class RedisDownApiFixture : IAsyncLifetime
{
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public string DatabaseName { get; } =
        $"planb_redisdown_{Guid.NewGuid():N}";

    private string _adminConnectionString = null!;

    public async Task InitializeAsync()
    {
        JasperFxEnvironment.AutoStartHost = true;

        _adminConnectionString = TestConnectionString.Resolve();

        var adminBuilder = new NpgsqlConnectionStringBuilder(_adminConnectionString)
        {
            Database = "postgres",
        };

        await using (var admin = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await admin.OpenAsync();
            await using var drop = new NpgsqlCommand(
                $"DROP DATABASE IF EXISTS \"{DatabaseName}\" WITH (FORCE);", admin);
            await drop.ExecuteNonQueryAsync();

            await using var create = new NpgsqlCommand(
                $"CREATE DATABASE \"{DatabaseName}\";", admin);
            await create.ExecuteNonQueryAsync();
        }

        adminBuilder.Database = DatabaseName;
        var testConnectionString = adminBuilder.ConnectionString;

        var closedPort = ReserveClosedPort();

        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
                builder.UseSetting("ConnectionStrings:Planb", testConnectionString);
                builder.UseSetting("ConnectionStrings:PlanbWolverine", testConnectionString);
                // syncTimeout gobierna el timeout de mensaje en el backlog para comandos sync Y
                // async (asyncTimeout, sin este, queda en su default de 5000 ms y no alcanza:
                // verificado con StackExchange.Redis 3.1.31 contra un puerto cerrado, un
                // db.StringGetAsync tarda ~5 s igual si solo se fija asyncTimeout).
                builder.UseSetting(
                    "ConnectionStrings:Redis",
                    $"localhost:{closedPort},connectTimeout=250,syncTimeout=250,connectRetry=1");
                builder.ConfigureServices(services =>
                {
                    services.RunWolverineInSoloMode();
                });
            });

        _ = Factory.Services;
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();

        var adminBuilder = new NpgsqlConnectionStringBuilder(_adminConnectionString)
        {
            Database = "postgres",
        };
        await using var admin = new NpgsqlConnection(adminBuilder.ConnectionString);
        await admin.OpenAsync();
        await using var drop = new NpgsqlCommand(
            $"DROP DATABASE IF EXISTS \"{DatabaseName}\" WITH (FORCE);", admin);
        await drop.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Un puerto que estuvo libre un instante: alcanza para que nada esté escuchando ahí sin
    /// pisarle un puerto fijo a otro servicio del entorno.
    /// </summary>
    private static int ReserveClosedPort()
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}
