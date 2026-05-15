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
/// Auth: post-JwtBearer middleware. Cada user borrado debe sign-in primero (vía
/// <see cref="AuthenticatedClient"/>); el endpoint deriva el UserId del claim sub.
///
/// Coverage:
///   - 204 + the user row is gone from identity.users
///   - 204 + the cascade removes student_profiles owned by the user
///   - 204 + a user_deletion_log row is written with the right user_id and a hashed email
///   - 401 when no session cookie
///   - 404 idempotent NO aplica más: tras el primer delete, la sesión sigue válida pero el
///     refresh + claim sub apuntan a un user que ya no existe → 404. Pero la cookie podría
///     re-emitirse desde sign-in (que fallaría con 401 si el user no está). Acá testeamos
///     el camino del primer delete + verificación en DB.
/// </summary>
public class DeleteAccountEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public DeleteAccountEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Returns_204_and_user_row_is_removed_from_database()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"delete-204.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.DeleteAsync("/api/me/account");

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.FindAsync(auth.UserId);
        user.ShouldBeNull();
    }

    [Fact]
    public async Task Returns_204_and_writes_an_audit_log_row_with_hashed_email()
    {
        var rawEmail = $"delete-audit.{Guid.NewGuid():N}@planb.local";
        var auth = await AuthenticatedClient.CreateAsync(_fixture, rawEmail);

        var response = await auth.Client.DeleteAsync("/api/me/account");

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var log = await db.UserDeletionLogs
            .FirstOrDefaultAsync(l => l.UserId == auth.UserId);
        log.ShouldNotBeNull();

        var expectedHash = UserDeletionLog.HashEmail(EmailAddress.Create(rawEmail).Value);
        log!.EmailHash.ShouldBe(expectedHash);
        log.EmailHash.ShouldNotContain("planb.local");
    }

    [Fact]
    public async Task Cascade_removes_student_profile_owned_by_the_deleted_user()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"delete-cascade.{Guid.NewGuid():N}@planb.local");

        var planId = AcademicSeedData.Careers[2].Plan.Id.Value;
        var create = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = planId, enrollmentYear = 2024 });
        create.EnsureSuccessStatusCode();

        var response = await auth.Client.DeleteAsync("/api/me/account");
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        var orphanCount = await db.Database
            .SqlQueryRaw<int>(
                "SELECT COUNT(*)::int AS \"Value\" FROM identity.student_profiles WHERE user_id = {0}",
                auth.UserId.Value)
            .SingleAsync();
        orphanCount.ShouldBe(0);
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var bootstrap = _fixture.Factory.CreateClient();

        var response = await bootstrap.DeleteAsync("/api/me/account");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
