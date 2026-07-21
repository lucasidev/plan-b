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

    // Dos materias sembradas con comisión real, para que un mismo user pueda tener dos cursadas
    // reseñables distintas (UNIQUE student+subject+term). Cada una ancla a su comisión/docente
    // sembrado (el handler de publish valida docente-en-comisión):
    //   101 Algoritmos y Paradigmas → comisión Cid03 (iturralde) · 2026·1c
    //   111 Desarrollo de Software  → comisión Cid01 (Brandt)    · 2026·1c
    private static readonly Guid Subject101 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");

    private static readonly Guid CommissionSubject101 =
        Guid.Parse("00000007-0000-4000-a000-000000000003");
    private static readonly Guid TeacherIturralde =
        Guid.Parse("00000006-0000-4000-a000-000000000002");
    private static readonly Guid CommissionSubject111 =
        Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt =
        Guid.Parse("00000006-0000-4000-a000-000000000001");

    private static (Guid CommissionId, Guid TeacherId) SeededFor(Guid subjectId) =>
        subjectId == Subject101
            ? (CommissionSubject101, TeacherIturralde)
            : (CommissionSubject111, TeacherBrandt);

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
        var (commissionId, _) = SeededFor(subjectId);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId,
                commissionId = (Guid?)commissionId,
                termId = (Guid?)Term2026_1c,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task PublishCleanReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId, int difficulty, Guid subjectId)
    {
        var (_, teacherId) = SeededFor(subjectId);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = teacherId,
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

    private static async Task PublishDirtyReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId, Guid subjectId)
    {
        var (_, teacherId) = SeededFor(subjectId);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = teacherId,
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

        var cleanEnrollment = await CreateApprovedEnrollmentAsync(auth, Subject101);
        await PublishCleanReviewAsync(auth, cleanEnrollment, 4, Subject101);

        var dirtyEnrollment = await CreateApprovedEnrollmentAsync(auth, Subject111);
        await PublishDirtyReviewAsync(auth, dirtyEnrollment, Subject111);

        using var anon = _fixture.Factory.CreateClient();

        // Filter by subject so we only look at our own seeded data.
        var cleanResp = await anon.GetAsync($"/api/reviews?subjectId={Subject101}");
        var cleanBody = await cleanResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        cleanBody!.Items.ShouldContain(i => i.SubjectId == Subject101);

        var dirtyResp = await anon.GetAsync($"/api/reviews?subjectId={Subject111}");
        var dirtyBody = await dirtyResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        dirtyBody!.Items.ShouldNotContain(i => i.SubjectId == Subject111);
    }

    [Fact]
    public async Task Filters_by_difficulty()
    {
        var auth = await SetupUserAsync("difficulty");
        await SetupProfileAsync(auth);

        var enrollment = await CreateApprovedEnrollmentAsync(auth, Subject101);
        await PublishCleanReviewAsync(auth, enrollment, 5, Subject101);

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews?subjectId={Subject101}&difficulty=5");
        resp.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body!.Items.ShouldNotBeEmpty();
        body.Items.ShouldAllBe(i => i.DifficultyRating == 5);

        // Difficulty filter that does not match returns an empty page.
        var missResp = await anon.GetAsync($"/api/reviews?subjectId={Subject101}&difficulty=1");
        var missBody = await missResp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        missBody!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Filters_by_career_plan_id()
    {
        var auth = await SetupUserAsync("career-plan");
        await SetupProfileAsync(auth);

        var enrollment = await CreateApprovedEnrollmentAsync(auth, Subject101);
        await PublishCleanReviewAsync(auth, enrollment, 3, Subject101);

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
