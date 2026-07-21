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
/// Set-up: cada test arma un user autenticado, un profile, y un enrollment "Aprobada" anclado a
/// una comisión sembrada real (111 Desarrollo de Software · 2026·1c · comisión "A"). El handler
/// valida que el docente reseñado pertenezca a esa comisión (cross-BC vía Academic), así que la
/// review apunta a Brandt, titular de la comisión. Usar un commission_id random ya no sirve: la
/// validación lo rechaza con 400.
/// </summary>
public class PublishReviewEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Mismos seed IDs que los tests de Enrollments (Academic Seed data determinístico).
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject101 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    // 111 Desarrollo de Software + 2026·1c + comisión "A" con docente Brandt: la terna materia +
    // período + comisión coherente que exige la validación docente-en-comisión del handler de
    // publish (US-017 reforzada).
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid CommissionA =
        Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt =
        Guid.Parse("00000006-0000-4000-a000-000000000001");
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
    /// Crea un enrollment "Aprobada" anclado a la comisión sembrada 111 Desarrollo de Software ·
    /// 2026·1c · "A", cuyo titular es Brandt. Eso lo hace reseñable: la review puede
    /// apuntar a un docente real de la comisión y pasar la validación docente-en-comisión. Devuelve
    /// el id del enrollment creado.
    /// </summary>
    private static async Task<Guid> CreateReviewableEnrollmentAsync(AuthenticatedClient auth)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject111,
                commissionId = (Guid?)CommissionA,
                termId = (Guid?)Term2026_1c,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8.5m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    [Fact]
    public async Task Returns_400_when_docente_not_in_enrollment_commission()
    {
        var auth = await SetupUserWithProfileAsync("wrong-docente");
        var enrollmentId = await CreateReviewableEnrollmentAsync(auth);

        // Castro es un docente real, pero de OTRA comisión (la comisión "Noche" de 223 Desarrollo
        // Back End): no dictó la comisión "A" de 111 Desarrollo de Software del enrollment, así que
        // la review tiene que rebotar 400.
        var castro = Guid.Parse("00000006-0000-4000-a000-000000000006");
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = castro,
                difficultyRating = 3,
                overallRating = 4,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Intento de reseñar a un docente que no dictó esta comisión, debe rebotar.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
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
                docenteResenadoId = TeacherBrandt,
                difficultyRating = 4,
                overallRating = 5,
                hoursPerWeek = 10,
                tags = new[] { "claro explicando", "TPs bien armados" },
                wouldRecommendCourse = true,
                wouldRetakeTeacher = false,
                subjectText = "Materia exigente con buen material de lectura y prácticas claras. Vale la pena.",
                teacherText = (string?)null,
                finalGrade = 8.5m,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<PublishReviewResponse>();
        body.ShouldNotBeNull();
        body!.Status.ShouldBe("Published");
        body.DifficultyRating.ShouldBe(4);
        body.OverallRating.ShouldBe(5);
        body.HoursPerWeek.ShouldBe(10);
        body.Tags.ShouldBe(new[] { "claro explicando", "TPs bien armados" });
        body.WouldRecommendCourse.ShouldBeTrue();
        body.WouldRetakeTeacher.ShouldBeFalse();
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
                docenteResenadoId = TeacherBrandt,
                difficultyRating = 3,
                overallRating = 2,
                wouldRecommendCourse = false,
                wouldRetakeTeacher = false,
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
                overallRating = 3,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
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
                docenteResenadoId = TeacherBrandt,
                difficultyRating = 3,
                overallRating = 3,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
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
                subjectId = Subject101,
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
                overallRating = 3,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
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
            docenteResenadoId = TeacherBrandt,
            difficultyRating = 3,
            overallRating = 3,
            wouldRecommendCourse = true,
            wouldRetakeTeacher = true,
            subjectText = "Una primera reseña ya publicada para esta cursada, suficientemente larga.",
            teacherText = (string?)null,
            finalGrade = (decimal?)null,
        };

        var first = await auth.Client.PostAsJsonAsync("/api/reviews", payload);
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await auth.Client.PostAsJsonAsync("/api/reviews", payload);
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_400_when_overall_rating_out_of_range()
    {
        var auth = await SetupUserWithProfileAsync("bad-rating");
        var enrollmentId = await CreateReviewableEnrollmentAsync(auth);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = TeacherBrandt,
                difficultyRating = 3,
                overallRating = 7,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Reseña con overall rating fuera del rango permitido, debe rebotar 400.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_tag_not_in_allowed_set()
    {
        var auth = await SetupUserWithProfileAsync("bad-tag");
        var enrollmentId = await CreateReviewableEnrollmentAsync(auth);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = TeacherBrandt,
                difficultyRating = 3,
                overallRating = 4,
                tags = new[] { "etiqueta inventada que no existe" },
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Reseña con un tag fuera del set permitido, debe rebotar con 400.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // Mínima view del response de Enrollments para extraer el Id sin acoplar al record completo.
    private sealed record EnrollmentIdDto(Guid Id);
}
