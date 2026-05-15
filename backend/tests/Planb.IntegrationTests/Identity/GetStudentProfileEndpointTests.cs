using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Application.Features.GetStudentProfile;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Integration tests del endpoint GET /api/me/student-profile (US-037-b).
///
/// Cubre:
///   - 200 con el profile cuando el user lo creó previamente.
///   - 404 cuando el user existe pero no tiene profile (caso onboarding pendiente).
///   - 401 cuando no hay sesión (cookie planb_session ausente).
///
/// Auth: post-JwtBearer middleware. El UserId se deriva del claim sub del JWT;
/// el endpoint no acepta query params para identificar el caller.
/// </summary>
public class GetStudentProfileEndpointTests
    : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public GetStudentProfileEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Returns_200_with_profile_when_user_has_one()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"get-profile-200.{Guid.NewGuid():N}@planb.local");

        var planId = AcademicSeedData.Careers[2].Plan.Id.Value;
        var careerId = AcademicSeedData.Careers[2].Career.Id.Value;

        var create = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = planId, enrollmentYear = 2024 });
        create.EnsureSuccessStatusCode();

        var response = await auth.Client.GetAsync("/api/me/student-profile");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var profile = await response.Content.ReadFromJsonAsync<StudentProfileResponse>();
        profile.ShouldNotBeNull();
        profile!.UserId.ShouldBe(auth.UserId.Value);
        profile.CareerPlanId.ShouldBe(planId);
        profile.CareerId.ShouldBe(careerId);
        profile.EnrollmentYear.ShouldBe(2024);
    }

    [Fact]
    public async Task Returns_404_when_user_has_no_profile_yet()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"get-profile-404.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.GetAsync("/api/me/student-profile");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var bootstrap = _fixture.Factory.CreateClient();

        var response = await bootstrap.GetAsync("/api/me/student-profile");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
