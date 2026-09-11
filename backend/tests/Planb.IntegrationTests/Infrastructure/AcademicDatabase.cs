using Microsoft.EntityFrameworkCore;
using Npgsql;
using Planb.Academic.Infrastructure;
using Planb.Academic.Infrastructure.Persistence;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Crea un <see cref="AcademicDbContext"/> migrado en una base efímera propia del test, y sin
/// sembrar: cuando el sujeto del test es el seeder, la base tiene que arrancar como la encuentra
/// quien resiembra, no como la deja la plantilla de <see cref="TemplateDatabase"/>. Mismo contrato
/// que <see cref="IdentityDatabase"/>, incluido el drop de la base al disponer el handle.
/// </summary>
internal static class AcademicDatabase
{
    public static async Task<AcademicDatabaseHandle> CreateMigratedAsync(
        PostgresFixture fixture,
        string databaseName)
    {
        var adminBuilder = new NpgsqlConnectionStringBuilder(fixture.AdminConnectionString)
        {
            Database = "postgres",
        };
        var adminConnectionString = adminBuilder.ConnectionString;

        await using (var admin = new NpgsqlConnection(adminConnectionString))
        {
            await admin.OpenAsync();
            await using var create = new NpgsqlCommand(
                $"CREATE DATABASE \"{databaseName}\";", admin);
            await create.ExecuteNonQueryAsync();
        }

        adminBuilder.Database = databaseName;
        var testConnectionString = adminBuilder.ConnectionString;

        var context = Open(testConnectionString);
        await context.Database.MigrateAsync();

        return new AcademicDatabaseHandle(
            context, adminConnectionString, testConnectionString, databaseName);
    }

    /// <summary>
    /// Un contexto más contra la misma base, con el wiring de producción. Lo usa el test que
    /// necesita leer sin el ChangeTracker del contexto que escribió.
    /// </summary>
    public static AcademicDbContext Open(string connectionString)
    {
        var builder = new DbContextOptionsBuilder<AcademicDbContext>();
        DependencyInjection.ConfigureAcademicDbContext(builder, connectionString);
        return new AcademicDbContext(builder.Options);
    }
}

/// <summary>
/// Handle de un <see cref="AcademicDbContext"/> migrado en una base efímera, propia de un test.
/// Al disponerlo se dispone el contexto y se dropea la base, igual que
/// <see cref="IdentityDatabaseHandle"/>.
/// </summary>
internal sealed class AcademicDatabaseHandle(
    AcademicDbContext context,
    string adminConnectionString,
    string testConnectionString,
    string databaseName) : IAsyncDisposable
{
    public AcademicDbContext Context { get; } = context;

    public string ConnectionString { get; } = testConnectionString;

    public async ValueTask DisposeAsync()
    {
        await Context.DisposeAsync();

        try
        {
            // Npgsql poolea conexiones físicas por connection string: aunque el contexto ya se
            // dispuso, el pool puede seguir reteniendo abierta la conexión contra databaseName, y
            // eso hace fallar el DROP.
            NpgsqlConnection.ClearPool(new NpgsqlConnection(ConnectionString));

            await using var admin = new NpgsqlConnection(adminConnectionString);
            await admin.OpenAsync();
            await using var drop = new NpgsqlCommand(
                $"DROP DATABASE IF EXISTS \"{databaseName}\" WITH (FORCE);", admin);
            await drop.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            // Un test que ya pasó no se vuelve rojo porque falló la limpieza, pero el fallo no
            // queda en silencio: si esto empieza a aparecer seguido es señal de una fuga real.
            Console.Error.WriteLine(
                $"No se pudo dropear la base efímera \"{databaseName}\": {ex.Message}");
        }
    }
}
