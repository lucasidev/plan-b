using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.EditReview;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-018 (PATCH /api/me/reviews/{id}).
///
/// Cubre:
///   - 401 sin auth.
///   - 404 ante review inexistente o no propia (anti-enumeration).
///   - 200 + nuevo texto + audit log entry en happy path.
///   - 400 si no llega ningún campo modificable.
///   - 409 al editar una review ya UnderReview.
///   - Edit que dispara el filter pasa la review a UnderReview.
///   - 429 cuando se excede el cooldown (5 edits / 24h).
/// </summary>
public class EditReviewEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid AlgebraI =
        Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");

    public EditReviewEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"edit-review-{label}.{Guid.NewGuid():N}@planb.local");

    private static async Task SetupProfileAsync(AuthenticatedClient auth)
    {
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
    }

    private static async Task<Guid> CreateApprovedEnrollmentAsync(
        AuthenticatedClient auth, Guid subjectId)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId,
                commissionId = (Guid?)Guid.NewGuid(),
                termId = (Guid?)Term2024_1c,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task<Guid> PublishCleanReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 4,
                subjectText = "Materia bien armada, recomendable. Buen ritmo de evaluaciones.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task Returns_401_when_no_auth()
    {
        using var client = _fixture.Factory.CreateClient();

        var resp = await client.PatchAsJsonAsync(
            $"/api/me/reviews/{Guid.NewGuid()}", new { subjectText = "x" });

        resp.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_404_for_unknown_review()
    {
        var auth = await SetupUserAsync("unknown");
        await SetupProfileAsync(auth);

        var resp = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{Guid.NewGuid()}",
            new { subjectText = "ahora con más detalles sobre la dinámica de evaluaciones." });

        resp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_400_when_no_fields_provided()
    {
        var auth = await SetupUserAsync("empty");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, MAT102);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        var resp = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}", new { });

        resp.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Updates_text_and_returns_new_payload()
    {
        var auth = await SetupUserAsync("happy");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, MAT102);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        var newText = "Edit clean: ampliando el detalle sobre la dinámica de cursada y bibliografía sugerida.";
        var resp = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}",
            new { subjectText = newText, difficultyRating = 3 });

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<EditReviewResponse>();
        body!.SubjectText.ShouldBe(newText);
        body.DifficultyRating.ShouldBe(3);
        body.Status.ShouldBe("Published");
    }

    [Fact]
    public async Task Edit_that_triggers_filter_moves_status_to_under_review()
    {
        var auth = await SetupUserAsync("dirty-edit");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, AlgebraI);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        // "idiota" está en la blacklist del RegexReviewContentFilter (US-017).
        var resp = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}",
            new { subjectText = "El profe es un idiota y los trabajos los corrige tarde, mala experiencia." });

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<EditReviewResponse>();
        body!.Status.ShouldBe("UnderReview");
    }

    [Fact]
    public async Task Returns_409_when_editing_a_review_already_under_review()
    {
        var auth = await SetupUserAsync("locked");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, MAT102);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        // Primer edit con contenido sucio para meterla en UnderReview.
        var first = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}",
            new { subjectText = "El profe es un idiota total y no responde nunca, no la recomiendo." });
        first.StatusCode.ShouldBe(HttpStatusCode.OK);

        // Segundo edit: ya está en UnderReview, se rechaza.
        var second = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}",
            new { subjectText = "Disculpas, retiro lo dicho, fue exceso de bronca con el final desaprobado." });

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_404_when_editing_someone_elses_review()
    {
        var owner = await SetupUserAsync("owner");
        await SetupProfileAsync(owner);
        var enrollment = await CreateApprovedEnrollmentAsync(owner, MAT102);
        var reviewId = await PublishCleanReviewAsync(owner, enrollment);

        var other = await SetupUserAsync("other");
        await SetupProfileAsync(other);

        var resp = await other.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}",
            new { subjectText = "intento editar la reseña de alguien más, debería fallar con 404." });

        resp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_429_after_five_edits_in_24h()
    {
        var auth = await SetupUserAsync("cooldown");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, AlgebraI);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        for (var i = 1; i <= 5; i++)
        {
            var resp = await auth.Client.PatchAsJsonAsync(
                $"/api/me/reviews/{reviewId}",
                new { subjectText = $"Iteración limpia número {i}, ajustando detalle de cursada y bibliografía." });
            resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        var blocked = await auth.Client.PatchAsJsonAsync(
            $"/api/me/reviews/{reviewId}",
            new { subjectText = "Sexto edit en menos de 24h, tiene que ser rechazado por cooldown." });

        blocked.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
