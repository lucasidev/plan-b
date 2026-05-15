using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Tests integration de US-012. Confirma que:
///   - El endpoint POST /api/me/student-profiles persiste el StudentProfile en DB.
///   - La denormalización del CareerId desde el plan funciona contra el seed real de Academic.
///   - Los AC del aggregate (verified, year range, no duplicates) bubble-up a HTTP status correctos.
///   - El re-intento sobre la misma carrera retorna 409.
///
/// Auth: post-JwtBearer middleware. Cada test arma un user autenticado con
/// <see cref="AuthenticatedClient.CreateAsync"/>; el endpoint deriva el UserId del JWT en
/// la cookie planb_session.
/// </summary>
public class CreateStudentProfileEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    public CreateStudentProfileEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Returns_201_and_persists_profile_for_verified_user_and_valid_plan()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"create-profile-happy.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value, // TUDCS Plan 2018
                enrollmentYear = 2024,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == auth.UserId);
        var profile = user.StudentProfiles.ShouldHaveSingleItem();
        profile.CareerPlanId.ShouldBe(AcademicSeedData.Careers[2].Plan.Id.Value);
        profile.CareerId.ShouldBe(AcademicSeedData.Careers[2].Career.Id.Value);
        profile.EnrollmentYear.ShouldBe(2024);
    }

    [Fact]
    public async Task Returns_404_when_career_plan_does_not_exist_in_academic()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"create-profile-404.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                careerPlanId = Guid.NewGuid(), // plan que no existe
                enrollmentYear = 2024,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.student_profile.career_plan_not_found");
    }

    [Fact]
    public async Task Returns_401_when_user_email_not_verified_and_cannot_sign_in()
    {
        // Sin verificar, el sign-in falla con 401 → no podemos crear el AuthenticatedClient.
        // Validamos que el flujo de creación misma rechaza el unverified.
        using var bootstrap = _fixture.Factory.CreateClient();
        var email = $"create-profile-unverified.{Guid.NewGuid():N}@planb.local";
        var register = await bootstrap.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = "valid-password-12c" });
        register.EnsureSuccessStatusCode();

        // Sin email_verified_at update: sign-in rechaza.
        var signIn = await bootstrap.PostAsJsonAsync(
            "/api/identity/sign-in",
            new { email, password = "valid-password-12c" });
        signIn.StatusCode.ShouldBe(HttpStatusCode.Forbidden);

        // El endpoint /api/me/student-profiles sin sesión también rechaza con 401.
        var unauthedResp = await bootstrap.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value,
                enrollmentYear = 2024,
            });
        unauthedResp.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_409_when_user_already_has_active_profile_for_same_career()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"create-profile-dup.{Guid.NewGuid():N}@planb.local");

        var careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value;

        var first = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId, enrollmentYear = 2024 });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId, enrollmentYear = 2025 });

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var body = await second.Content.ReadAsStringAsync();
        body.ShouldContain("identity.student_profile.duplicate_for_career");
    }

    [Fact]
    public async Task Returns_400_when_enrollment_year_out_of_range()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"create-profile-year.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value,
                enrollmentYear = 1980, // < MinEnrollmentYear (2010)
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.student_profile.enrollment_year_out_of_range");
    }
}
