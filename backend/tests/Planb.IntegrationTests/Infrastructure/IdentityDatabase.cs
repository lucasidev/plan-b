using Microsoft.EntityFrameworkCore;
using Npgsql;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Creates a fresh, migrated <see cref="IdentityDbContext"/> inside a per-test database
/// so parallel tests don't step on each other's state.
/// </summary>
internal static class IdentityDatabase
{
    public static async Task<IdentityDatabaseHandle> CreateMigratedAsync(
        PostgresFixture fixture,
        string databaseName)
    {
        var adminBuilder = new NpgsqlConnectionStringBuilder(fixture.AdminConnectionString);
        adminBuilder.Database = "postgres";
        var adminConnectionString = adminBuilder.ConnectionString;

        // databaseName sale de FreshDb (ver IdentityDatabaseTests), que siempre le suma un Guid
        // nuevo: nunca puede existir ya una base con ese nombre exacto. El DROP inicial que había
        // acá antes era un viaje de más a Postgres que no pisaba nada; alcanza con el CREATE.
        await using (var admin = new NpgsqlConnection(adminConnectionString))
        {
            await admin.OpenAsync();
            await using var create = new NpgsqlCommand(
                $"CREATE DATABASE \"{databaseName}\";", admin);
            await create.ExecuteNonQueryAsync();
        }

        adminBuilder.Database = databaseName;
        var testConnectionString = adminBuilder.ConnectionString;

        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseNpgsql(testConnectionString, npgsql =>
            {
                npgsql.MapEnum<UserRole>(
                    enumName: "user_role",
                    schemaName: IdentityDbContext.SchemaName);

                npgsql.MigrationsHistoryTable(
                    tableName: "__ef_migrations_history",
                    schema: IdentityDbContext.SchemaName);
            })
            .Options;

        var context = new IdentityDbContext(options);
        await context.Database.MigrateAsync();

        return new IdentityDatabaseHandle(context, adminConnectionString, testConnectionString, databaseName);
    }
}

/// <summary>
/// Handle de un <see cref="IdentityDbContext"/> migrado en una base efímera, propia de un test.
///
/// Existe porque un <c>await using</c> directo sobre el <see cref="IdentityDbContext"/> solo
/// dispone el contexto, no la base: la base quedaba huérfana para siempre (el nombre trae un Guid
/// nuevo en cada corrida, así que ningún drop posterior la vuelve a pisar). Al disponer este
/// handle, además de disponer el contexto, se dropea la base.
/// </summary>
internal sealed class IdentityDatabaseHandle(
    IdentityDbContext context,
    string adminConnectionString,
    string testConnectionString,
    string databaseName) : IAsyncDisposable
{
    public IdentityDbContext Context { get; } = context;

    public async ValueTask DisposeAsync()
    {
        await Context.DisposeAsync();

        try
        {
            // Npgsql poolea conexiones físicas por connection string: aunque el contexto ya se
            // dispuso, el pool puede seguir reteniendo abierta la conexión contra databaseName, y
            // eso hace fallar el DROP. Limpiamos ese pool puntual antes de dropear en vez de confiar
            // en que el WITH (FORCE) llegue a tiempo.
            NpgsqlConnection.ClearPool(new NpgsqlConnection(testConnectionString));

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
