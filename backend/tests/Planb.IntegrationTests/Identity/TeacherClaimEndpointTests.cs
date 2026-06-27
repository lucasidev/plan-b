using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Application.Features.GetMyTeacherClaims;
using Planb.Identity.Application.Features.InitiateTeacherClaim;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Tests integration de US-030 (iniciar claim docente). Corre contra el seed determinístico de
/// Academic (docentes US-063). Cada test arma un member verificado con
/// <see cref="AuthenticatedClient.CreateAsync"/>; el endpoint deriva el UserId del JWT.
/// </summary>
public class TeacherClaimEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Brandt = Guid.Parse("00000006-0000-4000-a000-000000000001");
    private static readonly Guid Castro = Guid.Parse("00000006-0000-4000-a000-000000000006");
    private static readonly Guid Quiroga = Guid.Parse("00000006-0000-4000-a000-00000000000a");

    private readonly RegisterApiFixture _fixture;

    public TeacherClaimEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Returns_201_and_persists_pending_claim()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"claim-happy.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId = Brandt });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<InitiateTeacherClaimResponse>();
        body.ShouldNotBeNull();
        body!.TeacherId.ShouldBe(Brandt);
        body.IsVerified.ShouldBeFalse();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var profile = await db.TeacherProfiles.SingleAsync(p => p.UserId == auth.UserId);
        profile.TeacherId.ShouldBe(Brandt);
        profile.VerifiedAt.ShouldBeNull();
    }

    [Fact]
    public async Task Get_lists_my_claims_with_teacher_name_in_title_case()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"claim-get.{Guid.NewGuid():N}@planb.local");
        await auth.Client.PostAsJsonAsync("/api/me/teacher-claims", new { teacherId = Castro });

        var response = await auth.Client.GetAsync("/api/me/teacher-claims");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var claims = await response.Content.ReadFromJsonAsync<List<TeacherClaimItem>>();
        var claim = claims.ShouldHaveSingleItem();
        claim.TeacherId.ShouldBe(Castro);
        claim.TeacherName.ShouldBe("Jorge Castro"); // title case desde el storage lowercase
        claim.IsVerified.ShouldBeFalse();
    }

    [Fact]
    public async Task Returns_409_on_duplicate_claim_of_same_teacher()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"claim-dup.{Guid.NewGuid():N}@planb.local");

        var first = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId = Brandt });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId = Brandt });

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var body = await second.Content.ReadAsStringAsync();
        body.ShouldContain("identity.teacher_claim.already_claimed");
    }

    [Fact]
    public async Task Returns_404_when_teacher_does_not_exist()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"claim-404.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId = Guid.NewGuid() });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.teacher_claim.teacher_not_found");
    }

    [Fact]
    public async Task Returns_401_when_unauthenticated()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId = Brandt });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_410_when_teacher_was_soft_deleted()
    {
        // Damos de baja un docente dedicado (quiroga) por SQL directo para no interferir con los
        // otros tests de la clase (que reclaman brandt / castro). Simula el soft-delete entre el GET
        // (UI mostrando) y el POST (claim submit).
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var academic = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            await academic.Database.ExecuteSqlRawAsync(
                "UPDATE academic.teachers SET is_active = false WHERE id = {0}", Quiroga);
        }

        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"claim-410.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId = Quiroga });

        response.StatusCode.ShouldBe(HttpStatusCode.Gone);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("academic.teacher.removed");
    }
}
