using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Application.Features.GetStudentProfile;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Integration tests del endpoint GET /api/me/student-profiles (US-037-b).
///
/// Cubre:
///   - 200 con el profile cuando el user lo creó previamente.
///   - 404 cuando el user existe pero no tiene profile (caso onboarding pendiente).
///   - 400 cuando el query param falta o es Guid.Empty.
///
/// Reusa <see cref="RegisterApiFixture"/> para levantar el host con DB real + seed Academic
/// listo. El UserId va en query param (gap de auth, igual que CreateStudentProfileEndpoint).
/// </summary>
public class GetStudentProfileEndpointTests
    : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public GetStudentProfileEndpointTests(RegisterApiFixture fixture)
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
    public async Task Returns_200_with_profile_when_user_has_one()
    {
        var email = $"get-profile-200.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        // Crear el profile primero (el endpoint POST de US-012-b, que ya está shipped).
        var planId = AcademicSeedData.Careers[2].Plan.Id.Value;
        var careerId = AcademicSeedData.Careers[2].Career.Id.Value;

        var create = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { userId = userId.Value, careerPlanId = planId, enrollmentYear = 2024 });
        create.EnsureSuccessStatusCode();

        // Ahora el GET debería devolver el profile.
        var response = await _client.GetAsync(
            $"/api/me/student-profiles?userId={userId.Value}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var profile = await response.Content.ReadFromJsonAsync<StudentProfileResponse>();
        profile.ShouldNotBeNull();
        profile!.UserId.ShouldBe(userId.Value);
        profile.CareerPlanId.ShouldBe(planId);
        profile.CareerId.ShouldBe(careerId);
        profile.EnrollmentYear.ShouldBe(2024);
    }

    [Fact]
    public async Task Returns_404_when_user_has_no_profile_yet()
    {
        var email = $"get-profile-404.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        // Sin crear profile.
        var response = await _client.GetAsync(
            $"/api/me/student-profiles?userId={userId.Value}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_404_when_user_does_not_exist()
    {
        // Caller pasa un userId al azar — el read no encuentra nada y devuelve 404, igual que
        // si el user existiera pero sin profile. Es ambiguo intencional para no leakear "este
        // user existe / no existe" desde un endpoint sin auth.
        var unknownUserId = Guid.NewGuid();

        var response = await _client.GetAsync(
            $"/api/me/student-profiles?userId={unknownUserId}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_400_when_userId_missing()
    {
        var response = await _client.GetAsync("/api/me/student-profiles");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_userId_is_empty_guid()
    {
        var response = await _client.GetAsync(
            $"/api/me/student-profiles?userId={Guid.Empty}");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
