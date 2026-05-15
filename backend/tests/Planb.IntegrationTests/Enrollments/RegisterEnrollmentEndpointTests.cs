using System.Net;
using System.Net.Http.Json;
using Planb.Enrollments.Application.Features.RegisterEnrollment;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Enrollments;

/// <summary>
/// Tests integration de US-013 (cargar historial). Confirma que el endpoint:
///   - Persiste un EnrollmentRecord cuando todo está bien.
///   - 404 si el user no tiene StudentProfile activo.
///   - 400 si el subject no pertenece al plan del student.
///   - 400 con cada invariante del data-model.
///   - 409 si ya existe un record para (student, subject, term).
///
/// Auth: post-JwtBearer middleware. Cada test arma un user autenticado con
/// <see cref="AuthenticatedClient.CreateAsync"/> + crea StudentProfile para que el endpoint
/// resuelva la identidad del caller desde el claim sub del JWT.
/// </summary>
public class RegisterEnrollmentEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Seed IDs reales (DB persistente entre tests del fixture).
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid ALG101 =
        Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2c =
        Guid.Parse("00000005-0000-4000-a000-000000000002");

    public RegisterEnrollmentEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserWithProfileAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"enrollments-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    [Fact]
    public async Task Returns_201_and_persists_record_aprobada_with_method()
    {
        var auth = await SetupUserWithProfileAsync("happy");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("equiv");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("regular");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        // User registered + verified pero sin profile.
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"enrollments-noprof.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("notinplan");

        var foreignSubject = Guid.NewGuid();

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("nograde");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("cursgrade");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("invstatus");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
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
        var auth = await SetupUserWithProfileAsync("dup");

        var payload = new
        {
            subjectId = MAT102,
            commissionId = (Guid?)null,
            termId = (Guid?)Term2024_1c,
            status = "Aprobada",
            approvalMethod = "FinalLibre",
            grade = 8m,
        };

        var first = await auth.Client.PostAsJsonAsync("/api/me/enrollment-records", payload);
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync("/api/me/enrollment-records", payload);
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Different_term_for_same_subject_allowed_recursada_case()
    {
        var auth = await SetupUserWithProfileAsync("recursada");

        var first = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Reprobada",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = MAT102,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_2c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = 8m,
            });
        second.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var bootstrap = _fixture.Factory.CreateClient();

        var response = await bootstrap.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = MAT102,
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "FinalLibre",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
