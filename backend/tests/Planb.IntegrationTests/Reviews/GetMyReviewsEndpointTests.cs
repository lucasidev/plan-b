using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.GetMyReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-048 tab Mías (<c>GET /api/reviews/me</c>).
///
/// Cubre:
///   - 401 sin auth.
///   - 200 con payload vacío cuando el user no tiene profile.
///   - 200 con payload vacío cuando hay profile pero no hay reviews publicadas.
///   - Lista las reviews del alumno con join al subject (code + name).
///   - Stats: cuenta Published vs UnderReview en el GROUP BY.
///   - El alumno solo ve sus propias reviews (no leak cross-user).
/// </summary>
public class GetMyReviewsEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // Dos materias sembradas con comisión real, para que un mismo user pueda tener dos cursadas
    // reseñables distintas (UNIQUE student+subject+term exige que difieran). Cada una ancla a su
    // comisión/docente sembrado (el handler de publish valida docente-en-comisión):
    //   101 Algoritmos y Paradigmas → comisión "Mañana" (iturralde) · 2026·1c
    //   111 Desarrollo de Software  → comisión "A" (Brandt)         · 2026·1c
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

    // Comisión + docente sembrados que corresponden a cada materia reseñable de arriba.
    private static (Guid CommissionId, Guid TeacherId) SeededFor(Guid subjectId) =>
        subjectId == Subject101
            ? (CommissionSubject101, TeacherIturralde)
            : (CommissionSubject111, TeacherBrandt);

    public GetMyReviewsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"my-reviews-{label}.{Guid.NewGuid():N}@planb.local");

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
                status = "Passed",
                approvalMethod = "FinalExam",
                grade = 8m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task PublishCleanReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId, Guid subjectId)
    {
        var (_, teacherId) = SeededFor(subjectId);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = teacherId,
                difficultyRating = 4,
                overallRating = 5,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Materia exigente pero bien estructurada. Recomendable para los que quieren profundizar.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        resp.EnsureSuccessStatusCode();
    }

    private static async Task PublishDirtyReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId, Guid subjectId)
    {
        var (_, teacherId) = SeededFor(subjectId);
        // "idiota" is on the embedded blacklist → the content filter quarantines the review.
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
                subjectText = "El contenido está bien pero el profe es un idiota y no me devuelve los trabajos.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });
        resp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Returns_401_when_no_auth()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/reviews/me");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_empty_payload_when_user_has_no_profile()
    {
        var auth = await SetupUserAsync("no-profile");

        var response = await auth.Client.GetAsync("/api/reviews/me");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldBeEmpty();
        body.Stats.TotalCount.ShouldBe(0);
        body.Stats.PublishedCount.ShouldBe(0);
        body.Stats.UnderReviewCount.ShouldBe(0);
        body.Stats.RemovedCount.ShouldBe(0);
    }

    [Fact]
    public async Task Returns_empty_payload_when_profile_has_no_reviews()
    {
        var auth = await SetupUserAsync("no-reviews");
        await SetupProfileAsync(auth);

        var response = await auth.Client.GetAsync("/api/reviews/me");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyReviewsResponse>();
        body!.Items.ShouldBeEmpty();
        body.Stats.TotalCount.ShouldBe(0);
    }

    [Fact]
    public async Task Lists_reviews_with_subject_join_and_correct_stats()
    {
        var auth = await SetupUserAsync("happy");
        await SetupProfileAsync(auth);

        var cleanEnrollment = await CreateApprovedEnrollmentAsync(auth, Subject101);
        await PublishCleanReviewAsync(auth, cleanEnrollment, Subject101);

        var dirtyEnrollment = await CreateApprovedEnrollmentAsync(auth, Subject111);
        await PublishDirtyReviewAsync(auth, dirtyEnrollment, Subject111);

        var response = await auth.Client.GetAsync("/api/reviews/me");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Items.Count.ShouldBe(2);

        // Sorted newest first → dirty was published second.
        var first = body.Items[0];
        first.EnrollmentId.ShouldBe(dirtyEnrollment);
        first.Status.ShouldBe("UnderReview");
        first.SubjectId.ShouldBe(Subject111);
        first.SubjectCode.ShouldNotBeNullOrWhiteSpace();
        first.SubjectName.ShouldNotBeNullOrWhiteSpace();

        var second = body.Items[1];
        second.EnrollmentId.ShouldBe(cleanEnrollment);
        second.Status.ShouldBe("Published");
        second.SubjectId.ShouldBe(Subject101);
        second.FinalGrade.ShouldBe(8m);

        body.Stats.TotalCount.ShouldBe(2);
        body.Stats.PublishedCount.ShouldBe(1);
        body.Stats.UnderReviewCount.ShouldBe(1);
        body.Stats.RemovedCount.ShouldBe(0);
    }

    [Fact]
    public async Task Does_not_leak_other_users_reviews()
    {
        var alice = await SetupUserAsync("alice");
        await SetupProfileAsync(alice);
        var aliceEnrollment = await CreateApprovedEnrollmentAsync(alice, Subject101);
        await PublishCleanReviewAsync(alice, aliceEnrollment, Subject101);

        var bob = await SetupUserAsync("bob");
        await SetupProfileAsync(bob);

        var bobResponse = await bob.Client.GetAsync("/api/reviews/me");
        bobResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var bobBody = await bobResponse.Content.ReadFromJsonAsync<GetMyReviewsResponse>();
        bobBody!.Items.ShouldBeEmpty();
        bobBody.Stats.TotalCount.ShouldBe(0);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
