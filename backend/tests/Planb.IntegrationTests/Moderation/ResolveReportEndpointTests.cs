using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Infrastructure.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Moderation;

/// <summary>
/// Tests integration de US-051 (resolver report: uphold / dismiss + detalle). Cubre el slice de
/// Moderation + el flujo cross-BC (Moderation publica ReviewRemovalRequested / ReviewReportsResolved,
/// Reviews los consume y cambia el estado de la reseña). El cambio de estado es eventually-consistent
/// (outbox), así que se poolea el estado de la reseña vía DB.
/// </summary>
public class ResolveReportEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid PRG101 = Guid.Parse("00000004-0000-4000-a000-000000000004");
    private static readonly Guid Term2026_1c = Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid CommissionA = Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt = Guid.Parse("00000006-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public ResolveReportEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> ModeratorAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"mod.{Guid.NewGuid():N}@planb.local", role: UserRole.Moderator);

    private Task<AuthenticatedClient> MemberAsync(string label) =>
        AuthenticatedClient.CreateAsync(_fixture, $"{label}.{Guid.NewGuid():N}@planb.local");

    private async Task<Guid> SeedAuthoredReviewAsync(string label)
    {
        var author = await MemberAsync($"author-{label}");
        (await author.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 })).EnsureSuccessStatusCode();

        var enrollResp = await author.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = PRG101,
                commissionId = (Guid?)CommissionA,
                termId = (Guid?)Term2026_1c,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8m,
            });
        enrollResp.EnsureSuccessStatusCode();
        var enrollmentId = (await enrollResp.Content.ReadFromJsonAsync<IdDto>())!.Id;

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
        return (await reviewResp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task<Guid> ReportAsync(Guid reviewId, string label, string reason)
    {
        var reporter = await MemberAsync($"reporter-{label}");
        var resp = await reporter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/reports", new { reason });
        resp.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("reportId").GetGuid();
    }

    private async Task<bool> PollReviewStatusAsync(Guid reviewId, ReviewStatus expected, TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;
        while (DateTimeOffset.UtcNow < deadline)
        {
            using (var scope = _fixture.Factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ReviewsDbContext>();
                var status = await db.Reviews.AsNoTracking()
                    .Where(r => r.Id == new ReviewId(reviewId))
                    .Select(r => (ReviewStatus?)r.Status)
                    .FirstOrDefaultAsync();
                if (status == expected)
                {
                    return true;
                }
            }
            await Task.Delay(400);
        }
        return false;
    }

    private async Task<ReviewStatus?> ReviewStatusAsync(Guid reviewId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ReviewsDbContext>();
        return await db.Reviews.AsNoTracking()
            .Where(r => r.Id == new ReviewId(reviewId))
            .Select(r => (ReviewStatus?)r.Status)
            .FirstOrDefaultAsync();
    }

    [Fact]
    public async Task Uphold_removes_the_review_and_cascades_other_open_reports()
    {
        var reviewId = await SeedAuthoredReviewAsync("uphold");
        var r1 = await ReportAsync(reviewId, "uh1", "LenguajeInapropiado");
        var r2 = await ReportAsync(reviewId, "uh2", "DatosPersonales");
        var r3 = await ReportAsync(reviewId, "uh3", "Spam");

        var moderator = await ModeratorAsync();
        var uphold = await moderator.Client.PostAsJsonAsync(
            $"/api/moderation/reports/{r1}/uphold", new { resolutionNote = "Viola la política." });

        uphold.StatusCode.ShouldBe(HttpStatusCode.OK);
        var result = await uphold.Content.ReadFromJsonAsync<ResolveDto>();
        result!.Status.ShouldBe("Upheld");
        result.CascadedCount.ShouldBe(2); // r2 + r3 cerrados por cascade

        // La reseña se remueve (eventually-consistent vía outbox).
        (await PollReviewStatusAsync(reviewId, ReviewStatus.Removed, TimeSpan.FromSeconds(15)))
            .ShouldBeTrue("la reseña debería quedar Removed tras el uphold");

        // Los otros reports quedaron Upheld por cascade.
        var detail2 = await moderator.Client.GetFromJsonAsync<DetailDto>($"/api/moderation/reports/{r2}");
        detail2!.Status.ShouldBe("Upheld");
        var detail3 = await moderator.Client.GetFromJsonAsync<DetailDto>($"/api/moderation/reports/{r3}");
        detail3!.Status.ShouldBe("Upheld");
    }

    [Fact]
    public async Task Dismiss_restores_the_review_only_when_the_last_open_report_is_closed()
    {
        var reviewId = await SeedAuthoredReviewAsync("dismiss");
        var r1 = await ReportAsync(reviewId, "d1", "Spam");
        var r2 = await ReportAsync(reviewId, "d2", "OffTopic");
        var r3 = await ReportAsync(reviewId, "d3", "Difamacion");

        // La reseña quedó UnderReview por threshold.
        (await PollReviewStatusAsync(reviewId, ReviewStatus.UnderReview, TimeSpan.FromSeconds(15)))
            .ShouldBeTrue("la reseña debería quedar UnderReview tras 3 reportes");

        var moderator = await ModeratorAsync();

        // Dismiss de 2 de 3: queda 1 open, la reseña NO se restaura.
        (await moderator.Client.PostAsJsonAsync($"/api/moderation/reports/{r1}/dismiss", new { }))
            .EnsureSuccessStatusCode();
        (await moderator.Client.PostAsJsonAsync($"/api/moderation/reports/{r2}/dismiss", new { }))
            .EnsureSuccessStatusCode();
        (await ReviewStatusAsync(reviewId)).ShouldBe(ReviewStatus.UnderReview);

        // Dismiss del último: 0 open, la reseña vuelve a Published.
        (await moderator.Client.PostAsJsonAsync($"/api/moderation/reports/{r3}/dismiss", new { }))
            .EnsureSuccessStatusCode();
        (await PollReviewStatusAsync(reviewId, ReviewStatus.Published, TimeSpan.FromSeconds(15)))
            .ShouldBeTrue("la reseña debería restaurarse a Published tras cerrarse el último report");
    }

    [Fact]
    public async Task Resolving_an_already_resolved_report_returns_409()
    {
        var reviewId = await SeedAuthoredReviewAsync("idem");
        var reportId = await ReportAsync(reviewId, "idem1", "Spam");
        var moderator = await ModeratorAsync();

        (await moderator.Client.PostAsJsonAsync($"/api/moderation/reports/{reportId}/dismiss", new { }))
            .EnsureSuccessStatusCode();

        var second = await moderator.Client.PostAsJsonAsync(
            $"/api/moderation/reports/{reportId}/uphold", new { });
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync()).ShouldContain("moderation.report.already_resolved");
    }

    [Fact]
    public async Task Report_detail_returns_the_report_and_review_context()
    {
        var reviewId = await SeedAuthoredReviewAsync("detail");
        var reportId = await ReportAsync(reviewId, "det1", "DatosPersonales");
        var moderator = await ModeratorAsync();

        var detail = await moderator.Client.GetFromJsonAsync<DetailDto>(
            $"/api/moderation/reports/{reportId}");

        detail!.ReportId.ShouldBe(reportId);
        detail.ReviewId.ShouldBe(reviewId);
        detail.Reason.ShouldBe("DatosPersonales");
        detail.Tone.ShouldBe("urgent");
        detail.Status.ShouldBe("Open");
        detail.SubjectText.ShouldNotBeNullOrWhiteSpace(); // el body de la reseña vino por el JOIN
        detail.AuthorReviewsWritten.ShouldBeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Detail_of_unknown_report_is_404()
    {
        var moderator = await ModeratorAsync();

        var resp = await moderator.Client.GetAsync($"/api/moderation/reports/{Guid.NewGuid()}");

        resp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Member_cannot_uphold_403()
    {
        var member = await MemberAsync("intruder");

        var resp = await member.Client.PostAsJsonAsync(
            $"/api/moderation/reports/{Guid.NewGuid()}/uphold", new { });

        resp.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    private sealed record IdDto(Guid Id);
    private sealed record ResolveDto(Guid ReportId, string Status, int CascadedCount);
    private sealed record DetailDto(
        Guid ReportId, string Reason, string Tone, string Status, string? SubjectText,
        Guid ReviewId, int AuthorReviewsWritten);
}
