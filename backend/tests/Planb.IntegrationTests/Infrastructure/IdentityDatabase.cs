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
    public static async Task<IdentityDbContext> CreateMigratedAsync(
        PostgresFixture fixture,
        string databaseName)
    {
        var adminBuilder = new NpgsqlConnectionStringBuilder(fixture.AdminConnectionString);

        adminBuilder.Database = "postgres";
        await using (var admin = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await admin.OpenAsync();
            await using var drop = new NpgsqlCommand(
                $"DROP DATABASE IF EXISTS \"{databaseName}\" WITH (FORCE);", admin);
            await drop.ExecuteNonQueryAsync();

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
        return context;
    }
}
