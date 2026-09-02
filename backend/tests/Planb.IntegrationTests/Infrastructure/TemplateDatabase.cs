using System.Security.Cryptography;
using System.Text;
using JasperFx.CommandLine;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Reviews.Infrastructure.Persistence;
using Wolverine;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// La base plantilla: migrada y sembrada una sola vez, y de ahí en más cada clase de tests obtiene
/// su base con <c>CREATE DATABASE ... TEMPLATE</c>, que es una copia de archivos y no 57
/// migraciones más tres seeders.
///
/// <para>
/// Antes cada clase migraba y sembraba desde cero: 18 segundos de pared por una clase cuyos tres
/// tests tardan 246 milisegundos, cincuenta veces por corrida. La aislación no cambia: sigue
/// habiendo una base por clase, como pide ADR-0027; cambia de dónde sale.
/// </para>
///
/// <para>
/// <b>El nombre es un hash de los ensamblados</b> (el host y las tres infraestructuras, que es
/// donde viven migraciones y seeders), no un guid: dos corridas con el mismo código comparten la
/// plantilla y la segunda ni siquiera levanta el host para armarla. Un rebuild que cambie alguno
/// de los cuatro cambia el hash y arma una plantilla nueva. Las viejas quedan hasta que
/// <c>just db-prune</c> las barra: el nombre matchea <c>planb\_%</c>. Lo único que el hash no ve
/// es un cambio de datos de seed sin cambio de código (por ejemplo <c>personas.json</c>): los
/// seeders son idempotentes y agregan lo nuevo al arrancar cada clase, pero no corrigen lo que ya
/// estaba; para eso se dropea la plantilla a mano o con <c>db-prune</c>.
/// </para>
///
/// <para>
/// Dos reglas de Postgres gobiernan este archivo. Nadie puede estar conectado a la plantilla
/// mientras se copia: por eso, apenas queda armada, se terminan del lado del servidor los backends
/// que el host dejó cerrándose (Wolverine y los pools de Npgsql tardan en soltar), y la copia
/// reintenta si aun así Postgres ve alguno. Y una copia a la vez sobre la misma plantilla: por eso
/// el semáforo.
/// </para>
/// </summary>
internal static class TemplateDatabase
{
    private static readonly SemaphoreSlim CopyGate = new(1, 1);
    private static readonly Lazy<Task<string>> Template = new(EnsureCreatedAsync);

    /// <summary>El nombre de la plantilla de este código, armándola si no existe todavía.</summary>
    public static Task<string> EnsureAsync() => Template.Value;

    /// <summary>Crea <paramref name="databaseName"/> como copia de la plantilla.</summary>
    public static async Task CopyToAsync(string adminConnectionString, string databaseName)
    {
        var template = await EnsureAsync();

        await CopyGate.WaitAsync();
        try
        {
            await using var admin = new NpgsqlConnection(AdminOf(adminConnectionString));
            await admin.OpenAsync();

            await using (var drop = new NpgsqlCommand(
                $"DROP DATABASE IF EXISTS \"{databaseName}\" WITH (FORCE);", admin))
            {
                await drop.ExecuteNonQueryAsync();
            }

            // 55006 es "source database is being accessed by other users". Nadie usa la plantilla
            // de verdad, así que se cortan sus backends y se vuelve a intentar.
            for (var attempt = 1; ; attempt++)
            {
                try
                {
                    await using var create = new NpgsqlCommand(
                        $"CREATE DATABASE \"{databaseName}\" TEMPLATE \"{template}\";", admin);
                    await create.ExecuteNonQueryAsync();
                    return;
                }
                catch (PostgresException ex) when (ex.SqlState == "55006" && attempt < 50)
                {
                    await TerminateBackendsAsync(admin, template);
                    await Task.Delay(200);
                }
            }
        }
        finally
        {
            CopyGate.Release();
        }
    }

    private static async Task<string> EnsureCreatedAsync()
    {
        var adminConnectionString = TestConnectionString.Resolve();
        var name = $"planb_template_{CodeHash()}";

        await using var admin = new NpgsqlConnection(AdminOf(adminConnectionString));
        await admin.OpenAsync();

        await using (var exists = new NpgsqlCommand(
            "SELECT 1 FROM pg_database WHERE datname = @name;", admin))
        {
            exists.Parameters.AddWithValue("name", name);
            if (await exists.ExecuteScalarAsync() is not null)
            {
                await TerminateBackendsAsync(admin, name);
                return name;
            }
        }

        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{name}\";", admin))
        {
            await create.ExecuteNonQueryAsync();
        }

        var connectionString = new NpgsqlConnectionStringBuilder(adminConnectionString)
        {
            Database = name,
        }.ConnectionString;

        // El mismo arranque que después hace cada clase: en Development el host migra los tres
        // contextos, siembra personas, catálogo académico y cuestionario, y Wolverine crea su
        // schema. Es lo que convierte una base vacía en la plantilla.
        JasperFxEnvironment.AutoStartHost = true;
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
                builder.UseSetting("ConnectionStrings:Planb", connectionString);
                builder.UseSetting("ConnectionStrings:PlanbWolverine", connectionString);
                builder.ConfigureServices(services => services.RunWolverineInSoloMode());
            });
        _ = factory.Services;
        await factory.DisposeAsync();

        NpgsqlConnection.ClearAllPools();
        await TerminateBackendsAsync(admin, name);

        return name;
    }

    /// <summary>
    /// Corta toda conexión a la plantilla menos la propia. Es seguro porque la plantilla nunca
    /// vuelve a usarse como base de un host: solo se copia.
    /// </summary>
    private static async Task TerminateBackendsAsync(NpgsqlConnection admin, string database)
    {
        await using var terminate = new NpgsqlCommand(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity " +
            "WHERE datname = @db AND pid <> pg_backend_pid();", admin);
        terminate.Parameters.AddWithValue("db", database);
        await terminate.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Un hash estable de los cuatro ensamblados que definen el schema y los seeds. El
    /// ModuleVersionId cambia solo cuando el ensamblado se recompila, así que dos corridas sobre
    /// el mismo build comparten plantilla.
    /// </summary>
    private static string CodeHash()
    {
        var ids = new[]
        {
            typeof(Program).Assembly,
            typeof(IdentityDbContext).Assembly,
            typeof(AcademicDbContext).Assembly,
            typeof(ReviewsDbContext).Assembly,
        }.Select(a => a.ManifestModule.ModuleVersionId.ToString("N"));

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(string.Join("|", ids)));
        return Convert.ToHexString(bytes)[..32].ToLowerInvariant();
    }

    private static string AdminOf(string connectionString) =>
        new NpgsqlConnectionStringBuilder(connectionString) { Database = "postgres" }.ConnectionString;
}
