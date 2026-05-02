using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Application.Features.CreateStudentProfile;
using Planb.Identity.Domain.Users;
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
/// Usa el seed determinístico de AcademicSeedData (UNSTA + TUDCS + Plan 2018) para el plan
/// real. El UserId viene en el body porque el endpoint todavía no extrae JWT (gap operacional
/// documentado en CreateStudentProfileEndpoint.cs).
/// </summary>
public class CreateStudentProfileEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public CreateStudentProfileEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<UserId> RegisterAndVerifyAsync(string email)
    {
        // Register via API.
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = "valid-password-12c" });
        register.EnsureSuccessStatusCode();
        var body = await register.Content.ReadFromJsonAsync<RegisterResponseDto>();
        var userId = new UserId(body!.Id);

        // Marcar email_verified_at directamente vía SQL para no tener que parsear el token.
        // Simula el flow post-verify-email-click sin acoplar el test al endpoint de verify.
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE identity.users SET email_verified_at = NOW() WHERE id = {0}",
            userId.Value);

        return userId;
    }

    private sealed record RegisterResponseDto(Guid Id, string Email);

    [Fact]
    public async Task Returns_201_and_persists_profile_for_verified_user_and_valid_plan()
    {
        var email = $"create-profile-happy.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        var response = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                userId = userId.Value,
                careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value, // TUDCS Plan 2018
                enrollmentYear = 2024,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == userId);
        var profile = user.StudentProfiles.ShouldHaveSingleItem();
        profile.CareerPlanId.ShouldBe(AcademicSeedData.Careers[2].Plan.Id.Value);
        profile.CareerId.ShouldBe(AcademicSeedData.Careers[2].Career.Id.Value);
        profile.EnrollmentYear.ShouldBe(2024);
    }

    [Fact]
    public async Task Returns_404_when_career_plan_does_not_exist_in_academic()
    {
        var email = $"create-profile-404.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        var response = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                userId = userId.Value,
                careerPlanId = Guid.NewGuid(), // plan que no existe
                enrollmentYear = 2024,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.student_profile.career_plan_not_found");
    }

    [Fact]
    public async Task Returns_403_when_user_email_not_verified()
    {
        var email = $"create-profile-unverified.{Guid.NewGuid():N}@planb.local";

        // Register pero NO verificar.
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = "valid-password-12c" });
        var body = await register.Content.ReadFromJsonAsync<RegisterResponseDto>();

        var response = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                userId = body!.Id,
                careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value,
                enrollmentYear = 2024,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.ShouldContain("identity.account.email_not_verified");
    }

    [Fact]
    public async Task Returns_409_when_user_already_has_active_profile_for_same_career()
    {
        var email = $"create-profile-dup.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        var careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value;

        var first = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { userId = userId.Value, careerPlanId, enrollmentYear = 2024 });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { userId = userId.Value, careerPlanId, enrollmentYear = 2025 });

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var body = await second.Content.ReadAsStringAsync();
        body.ShouldContain("identity.student_profile.duplicate_for_career");
    }

    [Fact]
    public async Task Returns_400_when_enrollment_year_out_of_range()
    {
        var email = $"create-profile-year.{Guid.NewGuid():N}@planb.local";
        var userId = await RegisterAndVerifyAsync(email);

        var response = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new
            {
                userId = userId.Value,
                careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value,
                enrollmentYear = 1980, // < MinEnrollmentYear (2010)
            });

        // El validator de FluentValidation pasa (acepta > 1900); el aggregate rechaza con
        // EnrollmentYearOutOfRange que mapea a 400.
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.student_profile.enrollment_year_out_of_range");
    }
}
