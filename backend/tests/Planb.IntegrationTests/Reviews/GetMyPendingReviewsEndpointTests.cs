using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.GetMyPendingReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-048 tab Pendientes (<c>GET /api/reviews/me/pending</c>).
///
/// Cubre:
///   - 401 sin auth.
///   - 200 con lista vacía cuando el user todavía no tiene StudentProfile.
///   - Lista solo los enrollments terminales sin reseña.
///   - Excluye enrollments en Cursando.
///   - Excluye enrollments que ya tienen reseña publicada.
///   - El alumno solo ve sus propios pendings (no se cruzan entre users).
/// </summary>
public class GetMyPendingReviewsEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Seed IDs alineados con los demás integration tests (Academic seed determinístico).
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid AlgebraI =
        Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid AnalisisI =
        Guid.Parse("00000004-0000-4000-a000-000000000003");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");

    public GetMyPendingReviewsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"pending-reviews-{label}.{Guid.NewGuid():N}@planb.local");

    private static async Task SetupProfileAsync(AuthenticatedClient auth)
    {
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
    }

    private static async Task<Guid> CreateApprovedEnrollmentAsync(
        AuthenticatedClient auth, Guid? subjectId = null)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = subjectId ?? MAT102,
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

    private static async Task<Guid> CreateCursandoEnrollmentAsync(
        AuthenticatedClient auth, Guid? subjectId = null)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = subjectId ?? MAT102,
                commissionId = (Guid?)Guid.NewGuid(),
                termId = (Guid?)Term2024_1c,
                status = "Cursando",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task PublishReviewAsync(AuthenticatedClient auth, Guid enrollmentId)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = 3,
                overallRating = 4,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Reseña ya publicada para esta cursada, no debería aparecer en pendientes.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });
        resp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Returns_401_when_no_auth()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/reviews/me/pending");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_empty_list_when_user_has_no_profile()
    {
        var auth = await SetupUserAsync("no-profile");

        var response = await auth.Client.GetAsync("/api/reviews/me/pending");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Returns_empty_list_when_no_enrollments()
    {
        var auth = await SetupUserAsync("no-enrollments");
        await SetupProfileAsync(auth);

        var response = await auth.Client.GetAsync("/api/reviews/me/pending");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        body!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Lists_only_terminal_enrollments_without_review()
    {
        var auth = await SetupUserAsync("happy");
        await SetupProfileAsync(auth);

        // Three enrollments: one Aprobada with review, one Aprobada without review, one Cursando.
        // We use different subjects to avoid the UNIQUE(student, subject, term) constraint
        // colliding when we create two terminal enrollments for the same period.
        var reviewedId = await CreateApprovedEnrollmentAsync(auth, MAT102);
        await PublishReviewAsync(auth, reviewedId);

        var pendingId = await CreateApprovedEnrollmentAsync(auth, AlgebraI);

        var cursandoId = await CreateCursandoEnrollmentAsync(auth, AnalisisI);

        var response = await auth.Client.GetAsync("/api/reviews/me/pending");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        var items = body!.Items;

        items.ShouldHaveSingleItem();
        items[0].EnrollmentId.ShouldBe(pendingId);
        items[0].SubjectId.ShouldBe(AlgebraI);
        items[0].Status.ShouldBe("Aprobada");
        items[0].Grade.ShouldBe(8m);
        items[0].SubjectCode.ShouldNotBeNullOrWhiteSpace();
        items[0].SubjectName.ShouldNotBeNullOrWhiteSpace();

        // Sanity: the reviewed and cursando IDs are NOT included.
        items.ShouldNotContain(i => i.EnrollmentId == reviewedId);
        items.ShouldNotContain(i => i.EnrollmentId == cursandoId);
    }

    [Fact]
    public async Task Does_not_leak_other_users_pending_reviews()
    {
        var alice = await SetupUserAsync("alice");
        await SetupProfileAsync(alice);
        var aliceEnrollment = await CreateApprovedEnrollmentAsync(alice);

        var bob = await SetupUserAsync("bob");
        await SetupProfileAsync(bob);

        var bobResponse = await bob.Client.GetAsync("/api/reviews/me/pending");
        bobResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var bobBody = await bobResponse.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        bobBody!.Items.ShouldNotContain(i => i.EnrollmentId == aliceEnrollment);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
