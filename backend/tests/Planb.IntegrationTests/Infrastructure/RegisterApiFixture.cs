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
/// Boots a <see cref="WebApplicationFactory{TEntryPoint}"/> against an isolated Postgres database
/// that is a copy of the run's template (see <see cref="TemplateDatabase"/>): already migrated and
/// seeded, so the host's Development startup finds nothing pending. Wolverine's
/// <c>UseResourceSetupOnStartup</c> handles its own outbox/queue schema the same way.
///
/// <para>
/// One database per test class is what lets xUnit run the classes in parallel
/// (<c>parallelizeTestCollections</c> in <c>xunit.runner.json</c>): nothing is shared between
/// two classes except the Postgres server itself.
/// </para>
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

        await TemplateDatabase.CopyToAsync(_adminConnectionString, DatabaseName);

        _testConnectionString = new NpgsqlConnectionStringBuilder(_adminConnectionString)
        {
            Database = DatabaseName,
        }.ConnectionString;

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
        // Si el arranque falló, Factory es null y el error real ya salió por InitializeAsync:
        // tirar acá otra vez solo lo tapa con un NullReferenceException en el cleanup.
        if (Factory is not null)
        {
            await Factory.DisposeAsync();
        }

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
