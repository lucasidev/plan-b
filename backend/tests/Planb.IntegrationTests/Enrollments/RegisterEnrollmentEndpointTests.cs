using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
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
    private static readonly Guid Subject101 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Subject102 =
        Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2c =
        Guid.Parse("00000005-0000-4000-a000-000000000002");
    // 111 Desarrollo de Software, su período 2026-C1 y su comisión "A": la única terna del seed con
    // comisión real, necesaria para ejercitar la validación cross-BC de la comisión.
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Commission111A =
        Guid.Parse("00000007-0000-4000-a000-000000000001");

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
                subjectId = Subject101,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<RegisterEnrollmentResponse>();
        body.ShouldNotBeNull();
        body!.Status.ShouldBe("Passed");
        body.ApprovalMethod.ShouldBe("IndependentFinalExam");
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
                subjectId = Subject102,
                commissionId = (Guid?)null,
                termId = (Guid?)null,
                status = "Passed",
                approvalMethod = "CreditTransfer",
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
                subjectId = Subject101,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Regularized",
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
                subjectId = Subject101,
                termId = (Guid?)Term2024_1c,
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
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
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
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
                subjectId = Subject101,
                termId = (Guid?)Term2024_1c,
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
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
                subjectId = Subject101,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "InProgress",
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
                subjectId = Subject101,
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
            subjectId = Subject101,
            commissionId = (Guid?)null,
            termId = (Guid?)Term2024_1c,
            status = "Passed",
            approvalMethod = "IndependentFinalExam",
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
                subjectId = Subject101,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_1c,
                status = "Failed",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject101,
                commissionId = (Guid?)null,
                termId = (Guid?)Term2024_2c,
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
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
                subjectId = Subject101,
                termId = (Guid?)Term2024_1c,
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    // ── Validación cross-BC de comisión y período ─────────────────────────
    //
    // Sin FK cross-schema (ADR-0017) estas referencias son Guids sueltos, así que lo único que las
    // sostiene es esta validación en el application layer. Todos los demás tests del archivo mandan
    // commissionId null, o sea que el bloque entero no se ejecutaba nunca en la suite.

    [Fact]
    public async Task Returns_201_cuando_la_comision_corresponde_a_la_materia_y_el_periodo()
    {
        var auth = await SetupUserWithProfileAsync("comm-ok");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject111,
                commissionId = (Guid?)Commission111A,
                termId = (Guid?)Term2026_1c,
                status = "Passed",
                approvalMethod = "Coursework",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Returns_400_cuando_la_comision_no_existe()
    {
        var auth = await SetupUserWithProfileAsync("comm-404");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject111,
                commissionId = (Guid?)Guid.NewGuid(),
                termId = (Guid?)Term2026_1c,
                status = "Passed",
                approvalMethod = "Coursework",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString()
            .ShouldBe("enrollments.record.commission_not_found");
    }

    /// <summary>
    /// El caso que motiva toda la validación: una comisión real, pero de otra materia. Anclar la
    /// cursada ahí deja un registro que dice "cursé 101 en la comisión de 111", y de ahí sale el
    /// docente que después se puede reseñar.
    /// </summary>
    [Fact]
    public async Task Returns_400_cuando_la_comision_es_de_otra_materia()
    {
        var auth = await SetupUserWithProfileAsync("comm-subject");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject101,
                commissionId = (Guid?)Commission111A,
                termId = (Guid?)Term2026_1c,
                status = "Passed",
                approvalMethod = "Coursework",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString()
            .ShouldBe("enrollments.record.commission_not_for_subject");
    }

    [Fact]
    public async Task Returns_400_cuando_la_comision_es_de_otro_periodo()
    {
        var auth = await SetupUserWithProfileAsync("comm-term");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject111,
                commissionId = (Guid?)Commission111A,
                termId = (Guid?)Term2024_1c,
                status = "Passed",
                approvalMethod = "Coursework",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString()
            .ShouldBe("enrollments.record.commission_not_for_term");
    }

    [Fact]
    public async Task Returns_400_cuando_el_periodo_no_es_de_la_universidad_del_alumno()
    {
        var auth = await SetupUserWithProfileAsync("term-uni");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject101,
                commissionId = (Guid?)null,
                termId = (Guid?)Guid.NewGuid(),
                status = "Passed",
                approvalMethod = "IndependentFinalExam",
                grade = 8m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString()
            .ShouldBe("enrollments.record.term_not_in_university");
    }
}
