using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.GetMyTeacherClaims;
using Planb.Identity.Application.Features.InitiateTeacherClaim;
using Planb.Identity.Application.Features.VerifyTeacherClaim;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Tests integration de US-031 (verificación docente por email institucional). Corre contra el seed:
/// UNSTA tiene dominio <c>unsta.edu.ar</c> (migración AddUniversityEmailDomains) y los docentes
/// US-063. El flow: crear claim → submit email → (leer token de la DB, el mail va a Mailpit) → verify.
/// </summary>
public class TeacherVerificationEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Brandt = Guid.Parse("00000006-0000-4000-a000-000000000001");
    private static readonly Guid Castro = Guid.Parse("00000006-0000-4000-a000-000000000006");
    private static readonly Guid Iturralde = Guid.Parse("00000006-0000-4000-a000-000000000002");

    private readonly RegisterApiFixture _fixture;

    public TeacherVerificationEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private static async Task<Guid> CreateClaimAsync(AuthenticatedClient auth, Guid teacherId)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId });
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<InitiateTeacherClaimResponse>();
        return body!.ClaimId;
    }

    private async Task<string> ReadActiveTokenAsync(Planb.Identity.Domain.Users.UserId userId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var profile = await db.TeacherProfiles.AsNoTracking()
            .FirstAsync(p => p.UserId == userId);
        return profile.Tokens.Single(t => t.IsActive).Token;
    }

    [Fact]
    public async Task Submit_with_allowed_domain_returns_202_and_sets_email()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-submit.{Guid.NewGuid():N}@planb.local");
        var claimId = await CreateClaimAsync(auth, Brandt);

        var response = await auth.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claimId}/institutional-email",
            new { email = "profe.brandt@unsta.edu.ar" });

        response.StatusCode.ShouldBe(HttpStatusCode.Accepted);

        var claims = await auth.Client.GetFromJsonAsync<List<TeacherClaimItem>>(
            "/api/me/teacher-claims");
        var claim = claims!.ShouldHaveSingleItem();
        claim.IsVerified.ShouldBeFalse();
        claim.InstitutionalEmail.ShouldBe("profe.brandt@unsta.edu.ar");
    }

    [Fact]
    public async Task Submit_with_disallowed_domain_returns_400()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-domain.{Guid.NewGuid():N}@planb.local");
        var claimId = await CreateClaimAsync(auth, Castro);

        var response = await auth.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claimId}/institutional-email",
            new { email = "profe@gmail.com" });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.teacher_claim.email_domain_not_allowed");
    }

    [Fact]
    public async Task Verify_with_valid_token_marks_claim_verified()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-ok.{Guid.NewGuid():N}@planb.local");
        var claimId = await CreateClaimAsync(auth, Iturralde);
        await auth.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claimId}/institutional-email",
            new { email = "profe.iturralde@unsta.edu.ar" });

        var token = await ReadActiveTokenAsync(auth.UserId);
        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims/verify", new { token });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<VerifyTeacherClaimResponse>();
        body!.IsVerified.ShouldBeTrue();

        var claims = await auth.Client.GetFromJsonAsync<List<TeacherClaimItem>>(
            "/api/me/teacher-claims");
        claims!.ShouldHaveSingleItem().IsVerified.ShouldBeTrue();
    }

    [Fact]
    public async Task Verify_with_invalid_token_returns_404()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-badtok.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims/verify", new { token = "does-not-exist" });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.teacher_claim.token_invalid");
    }

    [Fact]
    public async Task Submit_to_a_claim_owned_by_someone_else_returns_403()
    {
        var owner = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-owner.{Guid.NewGuid():N}@planb.local");
        var claimId = await CreateClaimAsync(owner, Brandt);

        var intruder = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-intruder.{Guid.NewGuid():N}@planb.local");

        var response = await intruder.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claimId}/institutional-email",
            new { email = "intruder@unsta.edu.ar" });

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.teacher_claim.not_owner");
    }

    [Fact]
    public async Task Verify_rejects_when_another_user_already_verified_that_teacher()
    {
        // User A reclama y verifica a Castro.
        var userA = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-a.{Guid.NewGuid():N}@planb.local");
        var claimA = await CreateClaimAsync(userA, Castro);
        await userA.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claimA}/institutional-email",
            new { email = "castro.a@unsta.edu.ar" });
        var tokenA = await ReadActiveTokenAsync(userA.UserId);
        (await userA.Client.PostAsJsonAsync("/api/me/teacher-claims/verify", new { token = tokenA }))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        // User B reclama al mismo docente, ingresa email y trata de verificar: rechazado (ya hay uno verificado).
        var userB = await AuthenticatedClient.CreateAsync(
            _fixture, $"verif-b.{Guid.NewGuid():N}@planb.local");
        var claimB = await CreateClaimAsync(userB, Castro);
        await userB.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claimB}/institutional-email",
            new { email = "castro.b@unsta.edu.ar" });
        var tokenB = await ReadActiveTokenAsync(userB.UserId);

        var response = await userB.Client.PostAsJsonAsync(
            "/api/me/teacher-claims/verify", new { token = tokenB });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.teacher_claim.teacher_already_verified");
    }
}
