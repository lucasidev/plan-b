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
/// Boots a <see cref="WebApplicationFactory{TEntryPoint}"/> against an isolated, freshly-migrated
/// Postgres database. Wolverine's <c>UseResourceSetupOnStartup</c> handles its own outbox/queue
/// schema; EF migrations are applied by the host as part of the same startup.
/// </summary>
public sealed class RegisterApiFixture : IAsyncLifetime
{
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public string DatabaseName { get; } =
        $"planb_register_{Guid.NewGuid():N}";

    private string _testConnectionString = null!;
    private string _adminConnectionString = null!;

    public async Task InitializeAsync()
    {
        // Required when Program.cs ends with RunJasperFxCommands. Without this flag the
        // WebApplicationFactory builds the host but never starts it, leaving TestServer in a
        // half-initialized state. See https://wolverinefx.net/guide/http/integration-testing.html.
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
        _testConnectionString = adminBuilder.ConnectionString;

        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
                builder.UseSetting("ConnectionStrings:Planb", _testConnectionString);
                builder.UseSetting("ConnectionStrings:PlanbWolverine", _testConnectionString);
                builder.ConfigureServices(services =>
                {
                    // Solo mode skips leader election + durability agent polling, dropping
                    // cold-start time from ~6s to ~2s per test class.
                    services.RunWolverineInSoloMode();
                });
            });

        // Trigger startup. Program.cs runs EF MigrateAsync in Development before
        // the host starts serving, and Wolverine's UseResourceSetupOnStartup creates
        // its own schema, so by the time Services is materialized everything is
        // ready — we just need to force the lazy host build.
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
}
