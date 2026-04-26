using Microsoft.EntityFrameworkCore;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

[Collection(PostgresCollection.Name)]
public class IdentityDatabaseTests
{
    private readonly PostgresFixture _fixture;

    public IdentityDatabaseTests(PostgresFixture fixture) => _fixture = fixture;

    private static string FreshDb(string label) =>
        $"planb_{label}_{Guid.NewGuid():N}";

    [Fact]
    public async Task Initial_migration_creates_identity_schema_with_users_table()
    {
        await using var db = await IdentityDatabase.CreateMigratedAsync(
            _fixture, databaseName: FreshDb("migration"));

        var schemaExists = await db.Database.SqlQuery<bool>(
            $"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'identity') AS \"Value\"")
            .SingleAsync();
        schemaExists.ShouldBeTrue();

        var tableExists = await db.Database.SqlQuery<bool>(
            $"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'identity' AND table_name = 'users') AS \"Value\"")
            .SingleAsync();
        tableExists.ShouldBeTrue();

        var enumLabels = await db.Database.SqlQuery<string>(
            $@"SELECT e.enumlabel AS ""Value""
               FROM pg_enum e
               JOIN pg_type t ON e.enumtypid = t.oid
               JOIN pg_namespace n ON t.typnamespace = n.oid
               WHERE n.nspname = 'identity' AND t.typname = 'user_role'
               ORDER BY e.enumsortorder")
            .ToListAsync();
        enumLabels.ShouldBe(
            new[] { "member", "moderator", "admin", "university_staff" },
            ignoreOrder: true);
    }

    [Fact]
    public async Task Can_persist_and_read_a_user_roundtripping_all_fields()
    {
        await using var db = await IdentityDatabase.CreateMigratedAsync(
            _fixture, databaseName: FreshDb("roundtrip"));

        var clock = new FixedClock(new DateTimeOffset(2026, 4, 24, 12, 0, 0, TimeSpan.Zero));
        var email = EmailAddress.Create("Lucas@UNSTA.edu.ar").Value;
        var user = User.Register(email, "bcrypt$placeholder", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "raw-token", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("raw-token", clock);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        db.ChangeTracker.Clear();

        var loaded = await db.Users.SingleAsync(u => u.Id == user.Id);
        loaded.Email.Value.ShouldBe("lucas@unsta.edu.ar");
        loaded.PasswordHash.ShouldBe("bcrypt$placeholder");
        loaded.Role.ShouldBe(UserRole.Member);
        loaded.EmailVerifiedAt.ShouldBe(clock.UtcNow);
        loaded.CreatedAt.ShouldBe(clock.UtcNow);
        loaded.UpdatedAt.ShouldBe(clock.UtcNow);
        loaded.DisabledAt.ShouldBeNull();
    }

    [Fact]
    public async Task Duplicate_email_violates_unique_index()
    {
        await using var db = await IdentityDatabase.CreateMigratedAsync(
            _fixture, databaseName: FreshDb("unique"));

        var clock = new FixedClock(DateTimeOffset.UtcNow);
        var email = EmailAddress.Create("same@planb.local").Value;

        db.Users.Add(User.Register(email, "h1", clock).Value);
        await db.SaveChangesAsync();

        db.Users.Add(User.Register(email, "h2", clock).Value);
        await Should.ThrowAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }
}
