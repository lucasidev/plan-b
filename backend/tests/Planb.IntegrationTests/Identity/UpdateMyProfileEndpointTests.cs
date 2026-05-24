using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Application.Features.GetStudentProfile;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Integration tests para PATCH /api/me/student-profile (US-047). Cubre auth gate,
/// patch parcial happy path, validaciones del aggregate (displayName, yearOfStudy, legajo),
/// 404 si no hay profile activo (caso degenerado), 400 si body vacío.
/// </summary>
public class UpdateMyProfileEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public UpdateMyProfileEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    private async Task<AuthenticatedClient> CreateUserWithProfileAsync(string emailLabel)
    {
        var auth = await AuthenticatedClient.CreateAsync(_fixture, FreshEmail(emailLabel));
        var planId = AcademicSeedData.Careers[2].Plan.Id.Value;
        var create = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = planId, enrollmentYear = 2024 });
        create.EnsureSuccessStatusCode();
        return auth;
    }

    // ── Auth gate ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.PatchAsJsonAsync(
            "/api/me/student-profile", new { displayName = "Lucía Mansilla" });
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    // ── Happy paths ───────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_updates_all_fields_in_one_call()
    {
        var auth = await CreateUserWithProfileAsync("update-all");

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new
            {
                displayName = "Lucía Mansilla",
                yearOfStudy = 3,
                legajo = "12345",
                regularStudent = true,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var get = await auth.Client.GetAsync("/api/me/student-profile");
        var body = await get.Content.ReadFromJsonAsync<StudentProfileResponse>();
        body.ShouldNotBeNull();
        body!.DisplayName.ShouldBe("Lucía Mansilla");
        body.YearOfStudy.ShouldBe(3);
        body.Legajo.ShouldBe("12345");
        body.RegularStudent.ShouldBeTrue();
        body.UpdatedAt.ShouldNotBeNull();
    }

    [Fact]
    public async Task Patch_partial_only_updates_provided_fields()
    {
        var auth = await CreateUserWithProfileAsync("update-partial");

        var first = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new { displayName = "Lucía Mansilla", yearOfStudy = 2, legajo = "ABC123" });
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var second = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new { yearOfStudy = 3 });
        second.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var body = await (await auth.Client.GetAsync("/api/me/student-profile"))
            .Content.ReadFromJsonAsync<StudentProfileResponse>();
        body!.DisplayName.ShouldBe("Lucía Mansilla");
        body.YearOfStudy.ShouldBe(3);
        body.Legajo.ShouldBe("ABC123");
    }

    [Fact]
    public async Task Patch_trims_display_name_whitespace()
    {
        var auth = await CreateUserWithProfileAsync("update-trim");

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new { displayName = "   Mateo Giménez   " });
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var body = await (await auth.Client.GetAsync("/api/me/student-profile"))
            .Content.ReadFromJsonAsync<StudentProfileResponse>();
        body!.DisplayName.ShouldBe("Mateo Giménez");
    }

    // ── Validations ───────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_400_when_body_has_no_fields()
    {
        var auth = await CreateUserWithProfileAsync("update-empty");
        var response = await auth.Client.PatchAsJsonAsync("/api/me/student-profile", new { });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Patch_returns_400_when_display_name_blank_after_trim()
    {
        var auth = await CreateUserWithProfileAsync("update-blank");
        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile", new { displayName = "   " });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString().ShouldBe("identity.student_profile.display_name_invalid");
    }

    [Fact]
    public async Task Patch_returns_400_when_year_of_study_out_of_range()
    {
        var auth = await CreateUserWithProfileAsync("update-year");
        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile", new { yearOfStudy = 99 });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Patch_returns_400_when_legajo_too_long()
    {
        var auth = await CreateUserWithProfileAsync("update-legajo");
        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new { legajo = new string('X', 33) });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // ── No profile ────────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_404_when_user_has_no_active_profile()
    {
        // User sin profile creado (no llamamos a CreateUserWithProfileAsync).
        var auth = await AuthenticatedClient.CreateAsync(_fixture, FreshEmail("update-noprofile"));
        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/student-profile", new { yearOfStudy = 1 });
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // ── GET response shape (US-047 hidrata Mi perfil con este endpoint) ──

    [Fact]
    public async Task Get_returns_email_and_member_since_for_header()
    {
        var auth = await CreateUserWithProfileAsync("get-header");

        var response = await auth.Client.GetAsync("/api/me/student-profile");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<StudentProfileResponse>();
        body.ShouldNotBeNull();
        body!.Email.ShouldEndWith("@planb.local");
        body.MemberSince.ShouldBeLessThan(DateTimeOffset.UtcNow);
        body.MemberSince.ShouldBeGreaterThan(DateTimeOffset.UtcNow.AddMinutes(-10));
    }
}
