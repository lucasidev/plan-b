using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// La poda del rol institucional no reasigna ni borra cuentas existentes. Si stage todavía tiene
/// una, la migración frena antes de reconstruir el enum y exige resolver ese dato explícitamente.
/// </summary>
public class UniversityStaffRoleMigrationTests : IClassFixture<RegisterApiFixture>
{
    private const string MigrationId = "20260918150621_RemoveUniversityStaffRole";
    private readonly RegisterApiFixture _fixture;

    public UniversityStaffRoleMigrationTests(RegisterApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Migration_refuses_to_remove_a_role_that_an_existing_account_still_uses()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var migrations = db.Database.GetMigrations().ToList();
        var index = migrations.IndexOf(MigrationId);
        index.ShouldBeGreaterThan(0, "la migración de UniversityStaff debe seguir en el historial");

        var migrator = db.Database.GetService<IMigrator>();
        await migrator.MigrateAsync(migrations[index - 1]);

        await db.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO identity.users (
                id, email, password_hash, email_verified_at, role, created_at, updated_at
            ) VALUES (
                '00000001-0000-4000-a000-000000000534',
                'legacy-university-staff@planb.local',
                'legacy-disabled-password',
                NOW(),
                'university_staff'::identity.user_role,
                NOW(),
                NOW()
            );
            """);

        var exception = await Should.ThrowAsync<PostgresException>(() => migrator.MigrateAsync());

        exception.SqlState.ShouldBe("P0001");
        exception.MessageText.ShouldContain("identity.users still references the role");

        var applied = await db.Database.GetAppliedMigrationsAsync();
        applied.ShouldNotContain(MigrationId);

        var legacyAccounts = await db.Database.SqlQueryRaw<int>(
            """
            SELECT COUNT(*)::int AS "Value"
            FROM identity.users
            WHERE role = 'university_staff'::identity.user_role
            """).SingleAsync();
        legacyAccounts.ShouldBe(1);

        var enumLabels = await db.Database.SqlQueryRaw<string>(
            """
            SELECT e.enumlabel AS "Value"
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE n.nspname = 'identity' AND t.typname = 'user_role'
            """).ToListAsync();
        enumLabels.ShouldContain("university_staff");
    }
}
