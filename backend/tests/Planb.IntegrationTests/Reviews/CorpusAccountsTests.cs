using System.Net;
using System.Net.Http.Json;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Api.Infrastructure;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.AdminUsers;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Seeding;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

public class CorpusAccountsTests(RegisterApiFixture fixture) : IClassFixture<RegisterApiFixture>
{
    [Fact]
    public async Task Admin_cannot_restore_corpus_accounts_and_reseeding_still_succeeds()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        await CorpusAccountsSeed.SeedAsync(scope.ServiceProvider);
        var account = CorpusAccountsSeed.Accounts()[0];
        var admin = await AuthenticatedClient.CreateAsync(fixture,
            $"corpus-admin-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

        var restore = await admin.Client.PostAsync($"/api/identity/users/{account.Id}/restore", null);
        restore.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var page = await admin.Client.GetOkAsync<AdminUserPage>("/api/identity/users?search=corpus.planb.invalid");
        page.Total.ShouldBe(0);
        page.Items.ShouldBeEmpty();

        // Una nueva instancia comprueba el estado persistido después del intento administrativo.
        using var verification = fixture.Factory.Services.CreateScope();
        await CorpusAccountsSeed.SeedAsync(verification.ServiceProvider);
        var db = verification.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == new UserId(account.Id));
        user.IsDisabled.ShouldBeTrue();
        user.PasswordHash.ShouldBe(User.CorpusPasswordSentinel);
    }

    /// <summary>#530: reparar un corpus existente conserva sus reseñas y completa todas sus cuentas.</summary>
    [Fact]
    public async Task Existing_corpus_gets_verified_accounts_with_matching_profiles_and_earlier_dates()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var services = scope.ServiceProvider;
        await services.GetRequiredService<CorpusSeeder>().SeedAsync();
        var db = services.GetRequiredService<IdentityDbContext>();
        var connection = db.Database.GetDbConnection();
        var before = (await connection.QueryAsync<string>(
            "SELECT row_to_json(r)::text FROM reviews.reviews r ORDER BY id")).ToArray();
        before.ShouldNotBeEmpty();

        await CorpusAccountsSeed.SeedAsync(services);
        await CorpusAccountsSeed.SeedAsync(services);

        var missingOrInconsistent = await connection.ExecuteScalarAsync<int>("""
            SELECT count(*)::int FROM reviews.reviews r
            LEFT JOIN identity.users u ON u.id = r.account_id
            LEFT JOIN identity.student_profiles p ON p.user_id = u.id AND p.status = 'Active'
            JOIN academic.subjects s ON s.id = r.subject_id
            JOIN academic.career_plans cp ON cp.id = s.career_plan_id
            WHERE u.id IS NULL OR u.email_verified_at IS NULL OR u.role::text <> 'member'
                OR p.career_plan_id IS DISTINCT FROM s.career_plan_id
                OR p.career_id IS DISTINCT FROM cp.career_id
                OR u.created_at >= r.created_at OR p.created_at >= r.created_at
            """);
        missingOrInconsistent.ShouldBe(0);
        var users = await db.Users.Where(u => u.PasswordHash == "CORPUS_NO_LOGIN").ToListAsync();
        users.Count.ShouldBe(CorpusAccountsSeed.Accounts().Count);
        users.Select(u => u.CreatedAt).Distinct().Count().ShouldBeGreaterThan(30);
        users.ShouldAllBe(u => u.Email.Value.EndsWith("@corpus.planb.invalid") && u.IsDisabled);
        users.SelectMany(u => u.StudentProfiles).Select(p => p.CareerPlanId).Distinct().Count().ShouldBe(6);
        var hasher = services.GetRequiredService<IPasswordHasher>();
        users.ShouldAllBe(u => !hasher.Verify("CORPUS_NO_LOGIN", u.PasswordHash));

        var after = (await connection.QueryAsync<string>(
            "SELECT row_to_json(r)::text FROM reviews.reviews r ORDER BY id")).ToArray();
        after.ShouldBe(before);
    }

    /// <summary>#530: el acceso y la recuperación no convierten una cuenta sintética en una persona de prueba.</summary>
    [Fact]
    public async Task Synthetic_account_cannot_sign_in_or_request_password_reset()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        await CorpusAccountsSeed.SeedAsync(scope.ServiceProvider);
        using var client = fixture.Factory.CreateClient(new() { HandleCookies = false });
        var email = CorpusAccountsSeed.Accounts()[0].Email;
        var response = await client.PostAsJsonAsync("/api/identity/sign-in", new
        {
            email,
            password = "CORPUS_NO_LOGIN",
        });
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        response.Headers.Contains("Set-Cookie").ShouldBeFalse();

        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var connection = db.Database.GetDbConnection();
        var before = await connection.ExecuteScalarAsync<int>("SELECT count(*)::int FROM identity.verification_tokens");
        var reset = await client.PostAsJsonAsync("/api/identity/forgot-password", new { email });
        reset.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await connection.ExecuteScalarAsync<int>("SELECT count(*)::int FROM identity.verification_tokens")).ShouldBe(before);
    }
}

public class CorpusAccountCollisionTests(RegisterApiFixture fixture) : IClassFixture<RegisterApiFixture>
{
    /// <summary>#530: un correo ya registrado no autoriza a reemplazar su cuenta por la del corpus.</summary>
    [Fact]
    public async Task Reserved_email_collision_fails_without_changing_the_existing_account()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var services = scope.ServiceProvider;
        var db = services.GetRequiredService<IdentityDbContext>();
        var account = CorpusAccountsSeed.Accounts()[0];
        var user = User.Register(EmailAddress.Create(account.Email).Value, "EXISTING_ACCOUNT",
            services.GetRequiredService<IDateTimeProvider>()).Value;
        user.ClearDomainEvents();
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var count = await db.Users.CountAsync();

        var error = await Should.ThrowAsync<InvalidOperationException>(() => CorpusAccountsSeed.SeedAsync(services));
        error.Message.ShouldContain("belongs to another account");
        db.ChangeTracker.Clear();
        (await db.Users.CountAsync()).ShouldBe(count);
        var preserved = await db.Users.SingleAsync(u => u.Id == user.Id);
        preserved.PasswordHash.ShouldBe("EXISTING_ACCOUNT");
        preserved.IsEmailVerified.ShouldBeFalse();
        preserved.StudentProfiles.ShouldBeEmpty();
    }
}
