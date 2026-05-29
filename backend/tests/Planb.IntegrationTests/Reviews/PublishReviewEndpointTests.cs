using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.PublishReview;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-017 (publicar reseña). Cubre:
///   - Happy Path Published: filter clean → 201 Created, Status="Published".
///   - Happy Path UnderReview: filter triggered por palabra de blacklist → 201, Status="UnderReview".
///   - 401 sin auth (RequireAuthorization rechaza antes del handler).
///   - 404 cuando el enrollment no es del user.
///   - 409 cuando el enrollment está en status Cursando.
///   - 409 cuando ya hay reseña para el enrollment (idempotency).
///
/// Set-up: cada test arma un user autenticado, un profile, y un enrollment "Aprobada" con
/// commission_id válido. El commission_id es un UUID arbitrario (Reviews no valida hoy contra
/// Commission/Teacher porque esos aggregates llegan en una US posterior, ver doc US-017).
/// </summary>
public class PublishReviewEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Mismos seed IDs que los tests de Enrollments (Academic Seed data determinístico).
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");

    public PublishReviewEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserWithProfileAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"reviews-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>
    /// Crea un enrollment "Aprobada" con commission_id válido para que sirva de ancla a una
    /// review. Devuelve el id del enrollment recién creado.
    /// </summary>
    private static async Task<Guid> CreateReviewableEnrollmentAsync(
        AuthenticatedClient auth, Guid? commissionId = null)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = MAT102,
                commissionId = commissionId ?? Guid.NewGuid(),
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8.5m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    [Fact]
    public async Task Returns_201_and_published_when_filter_clean()
    {
        var auth = await SetupUserWithProfileAsync("clean");
        var enrollmentId = await CreateReviewableEnrollmentAsync(auth);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 4,
                subjectText = "Materia exigente con buen material de lectura y prácticas claras. Vale la pena.",
                teacherText = (string?)null,
                finalGrade = 8.5m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<PublishReviewResponse>();
        body.ShouldNotBeNull();
        body!.Status.ShouldBe("Published");
        body.DifficultyRating.ShouldBe(4);
        body.FinalGrade.ShouldBe(8.5m);
        body.EnrollmentId.ShouldBe(enrollmentId);
    }

    [Fact]
    public async Task Returns_201_and_under_review_when_filter_triggered()
    {
        var auth = await SetupUserWithProfileAsync("triggered");
        var enrollmentId = await CreateReviewableEnrollmentAsync(auth);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 3,
                // "idiota" está en la blacklist embebida, dispara el filter.
                subjectText = "La materia tiene su contenido pero el profe es un idiota total y no se preocupa.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<PublishReviewResponse>();
        body!.Status.ShouldBe("UnderReview");
    }

    [Fact]
    public async Task Returns_401_when_no_auth()
    {
        // Bootstrap client sin cookies.
        using var client = _fixture.Factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId = Guid.NewGuid(),
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 3,
                subjectText = "contenido suficientemente largo para pasar la validación mínima.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_404_when_enrollment_not_owned()
    {
        // User A crea un enrollment, user B intenta reseñarlo.
        var ownerAuth = await SetupUserWithProfileAsync("owner");
        var enrollmentId = await CreateReviewableEnrollmentAsync(ownerAuth);

        var strangerAuth = await SetupUserWithProfileAsync("stranger");

        var response = await strangerAuth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 3,
                subjectText = "Intento de reseñar la cursada de otro usuario, debe fallar con 404.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_409_when_enrollment_is_cursando()
    {
        var auth = await SetupUserWithProfileAsync("cursando");

        // Enrollment cursando: termId + commissionId, sin grade, status=Cursando.
        var enrollResp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = MAT102,
                commissionId = (Guid?)Guid.NewGuid(),
                termId = (Guid?)Term2024_1c,
                status = "Cursando",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        enrollResp.EnsureSuccessStatusCode();
        var enrollBody = await enrollResp.Content.ReadFromJsonAsync<EnrollmentIdDto>();

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId = enrollBody!.Id,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 3,
                subjectText = "Intento de reseñar una cursada en curso, debe fallar con 409.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_409_when_review_already_exists_for_enrollment()
    {
        var auth = await SetupUserWithProfileAsync("dup");
        var enrollmentId = await CreateReviewableEnrollmentAsync(auth);

        var payload = new
        {
            enrollmentId,
            docenteResenadoId = Guid.NewGuid(),
            difficultyRating = 3,
            subjectText = "Una primera reseña ya publicada para esta cursada, suficientemente larga.",
            teacherText = (string?)null,
            finalGrade = (decimal?)null,
        };

        var first = await auth.Client.PostAsJsonAsync("/api/reviews", payload);
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync("/api/reviews", payload);
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    // Mínima view del response de Enrollments para extraer el Id sin acoplar al record completo.
    private sealed record EnrollmentIdDto(Guid Id);
}
