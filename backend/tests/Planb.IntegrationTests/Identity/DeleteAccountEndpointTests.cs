using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Integration tests for DELETE /api/me/account (US-038-b).
///
/// Coverage:
///   - 204 + the user row is gone from identity.users
///   - 204 + the cascade removes student_profiles owned by the user
///   - 204 + a user_deletion_log row is written with the right user_id and a hashed email
///   - 404 when the user does not exist
///   - 404 idempotent: a second DELETE on the same userId returns 404 (the row is gone)
///   - 400 when userId query param is missing
///   - 400 when userId is Guid.Empty
///
/// We do NOT cover refresh-token revocation here because (a) the unit test already verifies
/// the handler calls RevokeAllForUserAsync after SaveChanges, and (b) the integration fixture
/// uses the real Redis but inspecting the revocation list contents per-user requires the
/// Redis index keys, which are private to the store impl. Adding that probe would couple the
/// test to the storage layout, kept out per testing pyramid (ADR-0036).
/// </summary>
public class DeleteAccountEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public DeleteAccountEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    private async Task<UserId> RegisterAndVerifyAsync(string email)
    {
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = "valid-password-12c" });
        register.EnsureSuccessStatusCode();
        var body = await register.Content.ReadFromJsonAsync<RegisterResponseDto>();
        var userId = new UserId(body!.Id);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE identity.users SET email_verified_at = NOW() WHERE id = {0}",
            userId.Value);

        return userId;
    }

    private sealed record RegisterResponseDto(Guid Id, string Email);

    [Fact]
    public async Task Returns_204_and_user_row_is_removed_from_database()
    {
        var email = $"delete-204.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        var response = await _client.DeleteAsync($"/api/me/account?userId={userId.Value}");

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.FindAsync(userId);
        user.ShouldBeNull();
    }

    [Fact]
    public async Task Returns_204_and_writes_an_audit_log_row_with_hashed_email()
    {
        var rawEmail = $"delete-audit.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(rawEmail);

        var response = await _client.DeleteAsync($"/api/me/account?userId={userId.Value}");

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var log = await db.UserDeletionLogs
            .FirstOrDefaultAsync(l => l.UserId == userId);
        log.ShouldNotBeNull();

        // EmailAddress.Create normalizes lowercase, so the hash must match the lowercased input.
        var expectedHash = UserDeletionLog.HashEmail(EmailAddress.Create(rawEmail).Value);
        log!.EmailHash.ShouldBe(expectedHash);
        log.EmailHash.ShouldNotContain("planb.local"); // sanity: no plaintext leaked
    }

    [Fact]
    public async Task Cascade_removes_student_profile_owned_by_the_deleted_user()
    {
        var email = $"delete-cascade.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        // Create a student profile via the existing US-012-b endpoint so the cascade has
        // something to remove.
        var planId = AcademicSeedData.Careers[2].Plan.Id.Value;
        var create = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { userId = userId.Value, careerPlanId = planId, enrollmentYear = 2024 });
        create.EnsureSuccessStatusCode();

        var response = await _client.DeleteAsync($"/api/me/account?userId={userId.Value}");
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        // EF owned-entity cascade is the contract being checked: with the user gone, no
        // student_profile row should reference its id (it lives in the same schema; raw SQL
        // because the DbSet does not expose StudentProfile directly).
        var orphanCount = await db.Database
            .SqlQueryRaw<int>(
                "SELECT COUNT(*)::int AS \"Value\" FROM identity.student_profiles WHERE user_id = {0}",
                userId.Value)
            .SingleAsync();
        orphanCount.ShouldBe(0);
    }

    [Fact]
    public async Task Returns_404_when_user_does_not_exist()
    {
        var unknownUserId = Guid.NewGuid();

        var response = await _client.DeleteAsync($"/api/me/account?userId={unknownUserId}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Second_delete_on_same_user_returns_404_idempotent()
    {
        var email = $"delete-idem.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        var first = await _client.DeleteAsync($"/api/me/account?userId={userId.Value}");
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var second = await _client.DeleteAsync($"/api/me/account?userId={userId.Value}");
        second.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_400_when_userId_missing()
    {
        var response = await _client.DeleteAsync("/api/me/account");
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_userId_is_empty_guid()
    {
        var response = await _client.DeleteAsync($"/api/me/account?userId={Guid.Empty}");
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
