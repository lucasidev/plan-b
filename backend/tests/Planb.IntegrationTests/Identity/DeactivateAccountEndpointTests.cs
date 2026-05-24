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
/// Integration tests para DELETE /api/me/account (ADR-0044, soft delete con anonimización).
///
/// Auth: post-JwtBearer middleware. Cada user debe sign-in primero (vía
/// <see cref="AuthenticatedClient"/>); el endpoint deriva el UserId del claim sub.
///
/// Coverage:
///   - 204 + el row SOBREVIVE con email anonimizado y deactivated_at seteado
///   - 204 + student_profiles del user borrados (PII)
///   - 204 + UserDeletionLog escrito con email hasheado (audit del flow)
///   - Re-registro del mismo email POST-deactivate funciona (test crítico del ADR)
///   - 409 si el user ya está deactivated (idempotency explícita)
///   - 401 sin sesión
/// </summary>
public class DeactivateAccountEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public DeactivateAccountEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    [Fact]
    public async Task Returns_204_and_user_row_survives_with_anonymized_email()
    {
        var rawEmail = FreshEmail("deactivate-anon");
        var auth = await AuthenticatedClient.CreateAsync(_fixture, rawEmail);

        var response = await auth.Client.DeleteAsync("/api/me/account");

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.FindAsync(auth.UserId);

        user.ShouldNotBeNull();
        user!.DeactivatedAt.ShouldNotBeNull();
        user.Email.Value.ShouldStartWith("deleted-");
        user.Email.Value.ShouldEndWith("@anonymized.local");
        user.Email.Value.ShouldNotContain(rawEmail.Split('@')[0]);
        user.PasswordHash.ShouldBe(User.DeactivatedPasswordSentinel);
    }

    [Fact]
    public async Task Cascade_removes_student_profile_owned_by_the_deactivated_user()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("deactivate-cascade"));

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
    public async Task Writes_audit_log_row_with_hashed_email()
    {
        var rawEmail = FreshEmail("deactivate-audit");
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
    public async Task Same_email_can_re_register_after_deactivate()
    {
        var rawEmail = FreshEmail("deactivate-rereg");
        var auth = await AuthenticatedClient.CreateAsync(_fixture, rawEmail);

        var deactivate = await auth.Client.DeleteAsync("/api/me/account");
        deactivate.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Re-registro con el mismo email: debe funcionar porque el partial unique index
        // filtra deactivated_at IS NULL, así que el row anonimizado del primer user no
        // bloquea el INSERT del nuevo.
        using var bootstrap = _fixture.Factory.CreateClient();
        var register = await bootstrap.PostAsJsonAsync(
            "/api/identity/register",
            new { email = rawEmail, password = "valid-password-12c" });

        register.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Returns_409_when_user_is_already_deactivated()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("deactivate-twice"));

        var first = await auth.Client.DeleteAsync("/api/me/account");
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Segundo intento con la misma sesión. La cookie sigue siendo válida (JWT firmado),
        // pero el handler chequea IsDeactivated y devuelve 409.
        var second = await auth.Client.DeleteAsync("/api/me/account");
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.DeleteAsync("/api/me/account");
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
