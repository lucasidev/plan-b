using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.SubjectInsights;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests de GET /api/reviews/insights?subjectId={id} (US-002): crowd insights agregados sobre
/// las reseñas Published de una materia. Cubre agregados, exclusión de UnderReview, materia
/// vacía y que el listado de reseñas no filtre identidad del autor (ADR-0009).
/// </summary>
public class SubjectInsightsEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Term2024_1c = Guid.Parse("00000005-0000-4000-a000-000000000001");

    // Distinct in-plan subjects per test: the class shares one database (IClassFixture), so two
    // tests seeding reviews for the same subject would cross-contaminate the aggregates.
    private static readonly Guid MAT102 = Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid AlgebraI = Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid INT101 = Guid.Parse("00000004-0000-4000-a000-000000000003");
    private static readonly Guid PRG101 = Guid.Parse("00000004-0000-4000-a000-000000000004");

    public SubjectInsightsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Aggregates_published_reviews_for_subject()
    {
        // Three clean reviews for MAT102: overall 5/3/1, recommend true/true/false.
        await PublishReviewAsync(MAT102, overall: 5, difficulty: 4, recommend: true, "clean-a");
        await PublishReviewAsync(MAT102, overall: 3, difficulty: 2, recommend: true, "clean-b");
        await PublishReviewAsync(MAT102, overall: 1, difficulty: 3, recommend: false, "clean-c");

        using var client = _fixture.Factory.CreateClient();
        var response = await client.GetAsync($"/api/reviews/insights?subjectId={MAT102}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var insights = await response.Content.ReadFromJsonAsync<SubjectReviewInsights>();
        insights.ShouldNotBeNull();
        insights!.TotalCount.ShouldBe(3);
        insights.AverageOverallRating!.Value.ShouldBe(3.0, 0.001);
        insights.AverageDifficulty!.Value.ShouldBe(3.0, 0.001);
        insights.RecommendPercentage!.Value.ShouldBe(200.0 / 3, 0.01); // 2 of 3
        // Histogram: one each at rating 1, 3, 5.
        insights.RatingHistogram.ShouldBe(new[] { 1, 0, 1, 0, 1 });
    }

    [Fact]
    public async Task Excludes_under_review_from_aggregates()
    {
        await PublishReviewAsync(AlgebraI, overall: 5, difficulty: 4, recommend: true, "clean");
        // "idiota" trips the content filter -> the review lands UnderReview, not Published.
        await PublishReviewAsync(
            AlgebraI, overall: 1, difficulty: 5, recommend: false, "dirty",
            text: "El profe es un idiota y no responde nunca, pésima experiencia de cursada.");

        using var client = _fixture.Factory.CreateClient();
        var response = await client.GetAsync($"/api/reviews/insights?subjectId={AlgebraI}");

        var insights = await response.Content.ReadFromJsonAsync<SubjectReviewInsights>();
        insights!.TotalCount.ShouldBe(1); // only the clean one
        insights.AverageOverallRating!.Value.ShouldBe(5.0, 0.001);
    }

    [Fact]
    public async Task Empty_subject_returns_zeros_and_nulls()
    {
        using var client = _fixture.Factory.CreateClient();
        // INT101 is untouched by the other tests in this class, so it stays empty.
        var response = await client.GetAsync($"/api/reviews/insights?subjectId={INT101}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var insights = await response.Content.ReadFromJsonAsync<SubjectReviewInsights>();
        insights!.TotalCount.ShouldBe(0);
        insights.AverageOverallRating.ShouldBeNull();
        insights.AverageDifficulty.ShouldBeNull();
        insights.RecommendPercentage.ShouldBeNull();
        insights.RatingHistogram.ShouldBe(new[] { 0, 0, 0, 0, 0 });
    }

    [Fact]
    public async Task Returns_400_without_subject_id()
    {
        using var client = _fixture.Factory.CreateClient();
        var response = await client.GetAsync("/api/reviews/insights");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Subject_reviews_list_does_not_leak_author_identity()
    {
        await PublishReviewAsync(PRG101, overall: 4, difficulty: 3, recommend: true, "privacy");

        using var client = _fixture.Factory.CreateClient();
        var response = await client.GetAsync($"/api/reviews?subjectId={PRG101}");
        var raw = await response.Content.ReadAsStringAsync();

        // ADR-0009: the public projection never carries author-identifying fields.
        raw.ShouldNotContain("userId", Case.Insensitive);
        raw.ShouldNotContain("studentProfileId", Case.Insensitive);
        raw.ShouldNotContain("studentId", Case.Insensitive);
        raw.ShouldNotContain("email", Case.Insensitive);
    }

    private async Task PublishReviewAsync(
        Guid subjectId, int overall, int difficulty, bool recommend, string label,
        string? text = null)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"insights-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        var enrollResp = await auth.Client.PostAsJsonAsync(
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
        enrollResp.EnsureSuccessStatusCode();
        var enrollmentId = (await enrollResp.Content.ReadFromJsonAsync<EnrollmentIdDto>())!.Id;

        var review = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = Guid.NewGuid(),
                difficultyRating = difficulty,
                overallRating = overall,
                wouldRecommendCourse = recommend,
                wouldRetakeTeacher = recommend,
                subjectText = text
                    ?? "Reseña de prueba para los agregados, contenido limpio y suficientemente largo.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        review.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
