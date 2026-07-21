using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.DeleteOwnReview;
using Planb.Reviews.Application.Features.GetMyReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-055 (DELETE /api/me/reviews/{id}).
///
/// Cubre:
///   - 401 sin auth.
///   - 404 review desconocida o ajena.
///   - 200 soft delete: status pasa a Deleted.
///   - Idempotencia: segunda llamada devuelve 200.
///   - La review desaparece del listado de Mías.
///   - La cursada reaparece en Pendientes tras borrar.
///   - Se puede reseñar de nuevo la cursada tras borrar (índice parcial).
/// </summary>
public class DeleteOwnReviewEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // Terna reseñable de materia + período + comisión (111 Desarrollo de Software · 2026·1c ·
    // comisión "A", titular Brandt). El handler de publish exige que el docente reseñado pertenezca
    // a la comisión de la cursada, por eso la reseña apunta a Brandt. Cada test usa un user fresco
    // con una sola cursada.
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid CommissionA =
        Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt =
        Guid.Parse("00000006-0000-4000-a000-000000000001");

    public DeleteOwnReviewEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"delete-review-{label}.{Guid.NewGuid():N}@planb.local");

    private static async Task SetupProfileAsync(AuthenticatedClient auth)
    {
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
    }

    // Crea una cursada aprobada anclada a la comisión sembrada "A" (111 Desarrollo de Software ·
    // 2026·1c), reseñable por Brandt. El subjectId se ignora para mantener estable la firma de los
    // call sites.
    private static async Task<Guid> CreateApprovedEnrollmentAsync(
        AuthenticatedClient auth, Guid subjectId)
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
                docenteResenadoId = TeacherBrandt,
                difficultyRating = 4,
                overallRating = 4,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Materia bien armada, recomendable para encarar con tiempo y constancia.",
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

        var resp = await client.DeleteAsync($"/api/me/reviews/{Guid.NewGuid()}");

        resp.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_404_for_unknown_review()
    {
        var auth = await SetupUserAsync("unknown");
        await SetupProfileAsync(auth);

        var resp = await auth.Client.DeleteAsync($"/api/me/reviews/{Guid.NewGuid()}");

        resp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Soft_deletes_and_returns_deleted_status()
    {
        var auth = await SetupUserAsync("happy");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, Subject111);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        var resp = await auth.Client.DeleteAsync($"/api/me/reviews/{reviewId}");
        resp.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<DeleteOwnReviewResponse>();
        body!.Id.ShouldBe(reviewId);
        body.Status.ShouldBe("Deleted");
        body.DeletedAt.ShouldNotBeNull();
    }

    [Fact]
    public async Task Is_idempotent()
    {
        var auth = await SetupUserAsync("idempotent");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, Subject111);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        var first = await auth.Client.DeleteAsync($"/api/me/reviews/{reviewId}");
        first.StatusCode.ShouldBe(HttpStatusCode.OK);

        var second = await auth.Client.DeleteAsync($"/api/me/reviews/{reviewId}");
        second.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await second.Content.ReadFromJsonAsync<DeleteOwnReviewResponse>();
        body!.Status.ShouldBe("Deleted");
    }

    [Fact]
    public async Task Removes_review_from_my_list()
    {
        var auth = await SetupUserAsync("mine");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, Subject111);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        await auth.Client.DeleteAsync($"/api/me/reviews/{reviewId}");

        var mineResp = await auth.Client.GetAsync("/api/reviews/me");
        var mine = await mineResp.Content.ReadFromJsonAsync<GetMyReviewsResponse>();
        mine!.Items.ShouldNotContain(i => i.Id == reviewId);
    }

    [Fact]
    public async Task Cursada_reappears_in_pending_and_is_reviewable_again()
    {
        var auth = await SetupUserAsync("rewrite");
        await SetupProfileAsync(auth);
        var enrollment = await CreateApprovedEnrollmentAsync(auth, Subject111);
        var reviewId = await PublishCleanReviewAsync(auth, enrollment);

        // Borrar.
        await auth.Client.DeleteAsync($"/api/me/reviews/{reviewId}");

        // La cursada reaparece en pendientes.
        var pendingResp = await auth.Client.GetAsync("/api/reviews/me/pending");
        var pendingBody = await pendingResp.Content.ReadFromJsonAsync<JsonElement>();
        var items = pendingBody.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("enrollmentId").GetGuid())
            .ToList();
        items.ShouldContain(enrollment);

        // Y se puede reseñar de nuevo (el índice parcial permite un segundo row vivo).
        var republish = await PublishCleanReviewAsync(auth, enrollment);
        republish.ShouldNotBe(reviewId);
    }

    [Fact]
    public async Task Returns_404_when_deleting_someone_elses_review()
    {
        var owner = await SetupUserAsync("owner");
        await SetupProfileAsync(owner);
        var enrollment = await CreateApprovedEnrollmentAsync(owner, Subject111);
        var reviewId = await PublishCleanReviewAsync(owner, enrollment);

        var other = await SetupUserAsync("other");
        await SetupProfileAsync(other);

        var resp = await other.Client.DeleteAsync($"/api/me/reviews/{reviewId}");
        resp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
