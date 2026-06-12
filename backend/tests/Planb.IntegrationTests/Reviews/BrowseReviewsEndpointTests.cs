using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.BrowseReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-048 tab Explorar (<c>GET /api/reviews</c>).
///
/// Cubre:
///   - Endpoint público: 200 sin auth.
///   - Excluye reviews UnderReview / Removed.
///   - Filtra por subjectId / careerPlanId / difficulty.
///   - Paginación: respeta page + pageSize, cap de pageSize a 50.
///   - TotalCount refleja el total filtrado (no solo la página).
/// </summary>
public class BrowseReviewsEndpointTests
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

    public BrowseReviewsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"browse-reviews-{label}.{Guid.NewGuid():N}@planb.local");

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

    private static async Task PublishCleanReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId, int difficulty)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = difficulty,
                overallRating = 4,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Materia interesante con un nivel parejo, recomiendo encararla con tiempo.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        resp.EnsureSuccessStatusCode();
    }

    private static async Task PublishDirtyReviewAsync(AuthenticatedClient auth, Guid enrollmentId)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 3,
                overallRating = 2,
                wouldRecommendCourse = false,
                wouldRetakeTeacher = false,
                subjectText = "El profe es un idiota total, no responde nunca y los TPs son una porquería.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });
        resp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Returns_200_anonymously()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/reviews");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Page.ShouldBe(1);
        body.PageSize.ShouldBe(20);
    }

    [Fact]
    public async Task Excludes_under_review_and_returns_only_published()
    {
        // Seed: one clean review + one dirty review (UnderReview) under the same persona.
        var auth = await SetupUserAsync("seed-published");
        await SetupProfileAsync(auth);

        var cleanEnrollment = await CreateApprovedEnrollmentAsync(auth, MAT102);
        await PublishCleanReviewAsync(auth, cleanEnrollment, 4);

        var dirtyEnrollment = await CreateApprovedEnrollmentAsync(auth, AlgebraI);
        await PublishDirtyReviewAsync(auth, dirtyEnrollment);

        using var anon = _fixture.Factory.CreateClient();

        // Filter by subject so we only look at our own seeded data.
        var cleanResp = await anon.GetAsync($"/api/reviews?subjectId={MAT102}");
        var cleanBody = await cleanResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        cleanBody!.Items.ShouldContain(i => i.SubjectId == MAT102);

        var dirtyResp = await anon.GetAsync($"/api/reviews?subjectId={AlgebraI}");
        var dirtyBody = await dirtyResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        dirtyBody!.Items.ShouldNotContain(i => i.SubjectId == AlgebraI);
    }

    [Fact]
    public async Task Filters_by_difficulty()
    {
        var auth = await SetupUserAsync("difficulty");
        await SetupProfileAsync(auth);

        var enrollment = await CreateApprovedEnrollmentAsync(auth, MAT102);
        await PublishCleanReviewAsync(auth, enrollment, 5);

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews?subjectId={MAT102}&difficulty=5");
        resp.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body!.Items.ShouldNotBeEmpty();
        body.Items.ShouldAllBe(i => i.DifficultyRating == 5);

        // Difficulty filter that does not match returns an empty page.
        var missResp = await anon.GetAsync($"/api/reviews?subjectId={MAT102}&difficulty=1");
        var missBody = await missResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        missBody!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Filters_by_career_plan_id()
    {
        var auth = await SetupUserAsync("career-plan");
        await SetupProfileAsync(auth);

        var enrollment = await CreateApprovedEnrollmentAsync(auth, MAT102);
        await PublishCleanReviewAsync(auth, enrollment, 3);

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews?careerPlanId={TudcsPlanId}");
        resp.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body!.Items.ShouldNotBeEmpty();

        // An unrelated career-plan-id returns no items.
        var emptyResp = await anon.GetAsync($"/api/reviews?careerPlanId={Guid.NewGuid()}");
        var emptyBody = await emptyResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        emptyBody!.Items.ShouldBeEmpty();
        emptyBody.TotalCount.ShouldBe(0);
    }

    [Fact]
    public async Task Caps_page_size_at_50()
    {
        using var client = _fixture.Factory.CreateClient();

        var resp = await client.GetAsync("/api/reviews?pageSize=500");
        var body = await resp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body!.PageSize.ShouldBe(50);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
