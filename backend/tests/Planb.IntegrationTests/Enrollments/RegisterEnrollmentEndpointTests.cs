using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Enrollments.Application.Features.RegisterEnrollment;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Enrollments;

/// <summary>
/// Tests integration de US-013 (cargar historial). Confirma que el endpoint:
///   - Persiste un EnrollmentRecord cuando todo está bien.
///   - 404 si el user no tiene StudentProfile activo.
///   - 400 si el subject no pertenece al plan del student.
///   - 400 con cada invariante del data-model (status/grade/method, equivalencia sin commission, etc).
///   - 409 si ya existe un record para (student, subject, term).
///
/// Reusa el patrón de CreateStudentProfileEndpointTests: registra+verifica un user vía API
/// real, crea StudentProfile vía API, luego ejerce el endpoint nuevo.
/// </summary>
public class RegisterEnrollmentEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    // Seed IDs reales (DB persistente entre tests del fixture).
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid TudcsCareerId =
        Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001"); // Subject del plan
    private static readonly Guid ALG101 =
        Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2c =
        Guid.Parse("00000005-0000-4000-a000-000000000002");

    public RegisterEnrollmentEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<UserId> SetupVerifiedUserWithProfileAsync()
    {
        var email = $"enrollments-test.{Guid.NewGuid():N}@planb.local";

        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = "valid-password-12c" });
        register.EnsureSuccessStatusCode();
        var body = await register.Content.ReadFromJsonAsync<RegisterResponseDto>();
        var userId = new UserId(body!.Id);

        // Force email verified.
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE identity.users SET email_verified_at = NOW() WHERE id = {0}",
            userId.Value);

        // Create StudentProfile.
        var profile = await _client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { userId = userId.Value, careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return userId;
    }

    private sealed record RegisterResponseDto(Guid Id, string Email);

    [Fact]
    public async Task Returns_201_and_persists_record_aprobada_with_method()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<RegisterEnrollmentResponse>();
        body.ShouldNotBeNull();
        body!.Status.ShouldBe("Aprobada");
        body.ApprovalMethod.ShouldBe("FinalLibre");
        body.Grade.ShouldBe(8m);
    }

    [Fact]
    public async Task Returns_201_for_equivalencia_without_commission_nor_term()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = ALG101,
                commissionId = (Guid?)null,
                termId = (Guid?)null,
                status = "Aprobada",
                approvalMethod = "Equivalencia",
                grade = 7m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Returns_201_for_regular_status()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Regular",
                approvalMethod = (string?)null,
                grade = 6m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Returns_404_when_user_has_no_student_profile()
    {
        // Registramos+verificamos pero NO creamos profile.
        var email = $"no-profile.{Guid.NewGuid():N}@planb.local";
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = "valid-password-12c" });
        var body = await register.Content.ReadFromJsonAsync<RegisterResponseDto>();
        var userId = body!.Id;

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId,
                subjectId = MAT102,
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_400_when_subject_does_not_belong_to_plan()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var foreignSubject = Guid.NewGuid(); // ningún subject seedeado matchea este id

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = foreignSubject,
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_for_aprobada_without_grade()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_for_cursando_with_grade()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Cursando",
                approvalMethod = (string?)null,
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_for_invalid_status_string()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                termId = (Guid?)Term2024_1c,
                status = "FooBar",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_409_when_duplicate_student_subject_term()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var payload = new
        {
            userId = userId.Value,
            subjectId = MAT102,
            commissionId = (Guid?)null,
            termId = (Guid?)Term2024_1c,
            status = "Aprobada",
            approvalMethod = "FinalLibre",
            grade = 8m,
        };

        var first = await _client.PostAsJsonAsync("/api/me/enrollment-records", payload);
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await _client.PostAsJsonAsync("/api/me/enrollment-records", payload);
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Different_term_for_same_subject_allowed_recursada_case()
    {
        var userId = await SetupVerifiedUserWithProfileAsync();

        var first = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Reprobada",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        // Misma materia, otro term: caso "recursada", debe aceptarse.
        var second = await _client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                userId = userId.Value,
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_2c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = 8m,
            });
        second.StatusCode.ShouldBe(HttpStatusCode.Created);
    }
}
