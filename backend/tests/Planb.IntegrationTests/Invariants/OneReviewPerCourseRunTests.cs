using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// Una cuenta, una reseña por materia y período: <c>UNIQUE(account_id, subject_id, term_id)</c>
/// (<c>ux_reviews_account_subject_term</c>, docs/engineering/data-model.md), para que la ficha
/// cuente una voz por persona y no dos.
/// </summary>
public class OneReviewPerCourseRunTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid Term = Guid.Parse("00000005-0000-4000-a000-000000000001");

    public OneReviewPerCourseRunTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<AuthenticatedClient> AccountAsync(string prefix)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"{prefix}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private static object ReviewBody() => new
    {
        subjectId = Subject211,
        termId = Term,
        chairId = (Guid?)ChairPerez,
        answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = 1 } },
        freeText = (string?)null,
    };

    /// <summary>
    /// Dos POST a la vez de la misma cuenta, misma materia y mismo período: exactamente uno gana.
    /// El otro no queda en un limbo ni duplica la voz, y un tercer intento, ya sin carrera de por
    /// medio, rebota igual.
    /// </summary>
    [Fact]
    public async Task Two_concurrent_submissions_from_the_same_account_leave_exactly_one_review()
    {
        var auth = await AccountAsync("onereview");

        var first = auth.Client.PostAsJsonAsync("/api/reviews/courses", ReviewBody());
        var second = auth.Client.PostAsJsonAsync("/api/reviews/courses", ReviewBody());
        var responses = await Task.WhenAll(first, second);

        var statusCodes = responses.Select(r => r.StatusCode).OrderBy(c => c).ToList();
        statusCodes.ShouldBe([HttpStatusCode.Created, HttpStatusCode.Conflict]);

        var mine = await auth.Client.GetFromJsonAsync<List<MyReviewView>>("/api/reviews/courses/me");
        mine.ShouldNotBeNull();
        mine!.Count(r => r.SubjectId == Subject211 && r.TermId == Term).ShouldBe(1);

        // Sin competencia de por medio, un segundo envío también rebota: la regla no depende de
        // haber ganado una carrera, es una restricción permanente sobre la cursada.
        var third = await auth.Client.PostAsJsonAsync("/api/reviews/courses", ReviewBody());
        third.StatusCode.ShouldBe(HttpStatusCode.Conflict);

        (await auth.Client.GetFromJsonAsync<List<MyReviewView>>("/api/reviews/courses/me"))!
            .Count(r => r.SubjectId == Subject211 && r.TermId == Term).ShouldBe(1);
    }
}
