using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Moderation.Application.Features.ReportReview;
using Planb.Reviews.Application.Features.GetMyReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Moderation;

/// <summary>
/// Tests integration de US-019 (POST /api/reviews/{id}/reports).
///
/// Cubre el slice de Moderation + el flujo cross-module de auto-quarantine (Moderation
/// publica ReviewQuarantineRequested, Reviews lo consume y pasa la review a UnderReview).
///
/// Cubre:
///   - 401 sin auth.
///   - 404 review desconocida.
///   - 403 reportar la propia.
///   - 201 reportar la de otro.
///   - 409 reporte duplicado.
///   - 400 details > 2000 + reason inválida.
///   - Threshold (default 3) dispara auto-quarantine: la review pasa a UnderReview.
/// </summary>
public class ReportReviewEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // Terna reseñable de materia + período + comisión (111 Desarrollo de Software · 2026·1c ·
    // comisión "A", titular Brandt). Cada author es un user fresco que publica una sola reseña:
    // anclar todas a esta terna no choca con UNIQUE(student, subject, term). El handler de publish
    // exige que el docente reseñado pertenezca a la comisión de la cursada, por eso la reseña
    // apunta a Brandt.
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid CommissionA =
        Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt =
        Guid.Parse("00000006-0000-4000-a000-000000000001");

    public ReportReviewEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"report-{label}.{Guid.NewGuid():N}@planb.local");

    private static async Task SetupProfileAsync(AuthenticatedClient auth)
    {
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
    }

    /// <summary>Creates an author with a published review and returns the review id.</summary>
    private async Task<(AuthenticatedClient Author, Guid ReviewId)> SeedAuthoredReviewAsync(string label)
    {
        var author = await SetupUserAsync(label);
        await SetupProfileAsync(author);

        var enrollResp = await author.Client.PostAsJsonAsync(
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
        enrollResp.EnsureSuccessStatusCode();
        var enrollmentId = (await enrollResp.Content.ReadFromJsonAsync<EnrollmentIdDto>())!.Id;

        var reviewResp = await author.Client.PostAsJsonAsync(
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
        reviewResp.EnsureSuccessStatusCode();
        var reviewId = (await reviewResp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        return (author, reviewId);
    }

    [Fact]
    public async Task Returns_401_when_no_auth()
    {
        using var client = _fixture.Factory.CreateClient();

        var resp = await client.PostAsJsonAsync(
            $"/api/reviews/{Guid.NewGuid()}/reports", new { reason = "Spam" });

        resp.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_404_for_unknown_review()
    {
        var reporter = await SetupUserAsync("reporter-404");

        var resp = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{Guid.NewGuid()}/reports", new { reason = "Spam" });

        resp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_403_when_reporting_own_review()
    {
        var (author, reviewId) = await SeedAuthoredReviewAsync("self");

        var resp = await author.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports",
            new { reason = "Spam", details = "intento reportar la mía" });

        resp.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Creates_report_for_another_users_review()
    {
        var (_, reviewId) = await SeedAuthoredReviewAsync("authored");
        var reporter = await SetupUserAsync("reporter-ok");

        var resp = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports",
            new { reason = "DatosPersonales", details = "menciona el legajo de un alumno" });

        resp.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await resp.Content.ReadFromJsonAsync<ReportReviewResponse>();
        body!.ReportId.ShouldNotBe(Guid.Empty);
        body.ThresholdReached.ShouldBeFalse();
    }

    [Fact]
    public async Task Returns_409_on_duplicate_report()
    {
        var (_, reviewId) = await SeedAuthoredReviewAsync("dup");
        var reporter = await SetupUserAsync("reporter-dup");

        var first = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports", new { reason = "Spam" });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports", new { reason = "OffTopic" });
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_400_when_details_too_long()
    {
        var (_, reviewId) = await SeedAuthoredReviewAsync("long");
        var reporter = await SetupUserAsync("reporter-long");

        var resp = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports",
            new { reason = "Spam", details = new string('x', 2001) });

        resp.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_for_unknown_reason()
    {
        var (_, reviewId) = await SeedAuthoredReviewAsync("badreason");
        var reporter = await SetupUserAsync("reporter-badreason");

        var resp = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports", new { reason = "NoExisteEstaRazon" });

        resp.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Threshold_reached_quarantines_review()
    {
        var (author, reviewId) = await SeedAuthoredReviewAsync("threshold");

        // Default threshold is 3 (Moderation:AutoHideThreshold). Three distinct reporters.
        ReportReviewResponse? lastBody = null;
        for (var i = 1; i <= 3; i++)
        {
            var reporter = await SetupUserAsync($"reporter-th-{i}");
            var resp = await reporter.Client.PostAsJsonAsync(
                $"/api/reviews/{reviewId}/reports", new { reason = "LenguajeInapropiado" });
            resp.StatusCode.ShouldBe(HttpStatusCode.Created);
            lastBody = await resp.Content.ReadFromJsonAsync<ReportReviewResponse>();
        }

        // The third report tipped the threshold (synchronous flag in the response).
        lastBody!.ThresholdReached.ShouldBeTrue();

        // The auto-quarantine is eventually-consistent (Moderation publishes, Reviews
        // consumes via the outbox). Poll the author's own listing until the review shows
        // UnderReview, with a generous timeout for the durability agent.
        var quarantined = await PollUntilStatusAsync(author, reviewId, "UnderReview", TimeSpan.FromSeconds(15));
        quarantined.ShouldBeTrue("the review should be auto-quarantined to UnderReview after the threshold");
    }

    private static async Task<bool> PollUntilStatusAsync(
        AuthenticatedClient author, Guid reviewId, string expectedStatus, TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;
        while (DateTimeOffset.UtcNow < deadline)
        {
            var resp = await author.Client.GetAsync("/api/reviews/me");
            if (resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadFromJsonAsync<GetMyReviewsResponse>();
                var item = body?.Items.FirstOrDefault(i => i.Id == reviewId);
                if (item is not null && item.Status == expectedStatus)
                {
                    return true;
                }
            }
            await Task.Delay(500);
        }
        return false;
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
