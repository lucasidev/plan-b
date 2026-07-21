using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.CastReviewVote;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests de POST /api/reviews/{id}/vote (votos de utilidad / helpfulness). Cubre cast, toggle
/// off, cambio de sentido, rechazo del auto-voto (403), reseña no votable (409), anónimo (401) y
/// que los conteos + "mi voto" aparezcan en el browse read.
/// </summary>
public class CastReviewVoteEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");

    // Triple sembrado reseñable (111 Desarrollo de Software · 2026·1c · comisión "A" Cid01,
    // titular Brandt). El handler de publish exige que el docente reseñado pertenezca a la
    // comisión de la cursada, así que toda reseña de estos tests ancla a Brandt en esa comisión.
    // Cada author es un user distinto y publica una sola reseña, así no choca con UNIQUE(student,
    // subject, term).
    private static readonly Guid Subject111 = Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c = Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid CommissionA = Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt = Guid.Parse("00000006-0000-4000-a000-000000000001");

    public CastReviewVoteEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Cast_helpful_returns_counts_and_my_vote()
    {
        var (author, reviewId) = await SetupAuthorWithReviewAsync(Subject111);
        var voter = await SetupUserWithProfileAsync("voter-a");

        var resp = await voter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/vote", new { helpful = true });

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<CastReviewVoteResponse>();
        body!.HelpfulCount.ShouldBe(1);
        body.NotHelpfulCount.ShouldBe(0);
        body.MyVoteIsHelpful.ShouldBe(true);
    }

    [Fact]
    public async Task Voting_same_value_twice_toggles_off()
    {
        var (author, reviewId) = await SetupAuthorWithReviewAsync(Subject111);
        var voter = await SetupUserWithProfileAsync("toggle");

        await voter.Client.PostAsJsonAsync($"/api/reviews/{reviewId}/vote", new { helpful = true });
        var second = await voter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/vote", new { helpful = true });

        var body = await second.Content.ReadFromJsonAsync<CastReviewVoteResponse>();
        body!.HelpfulCount.ShouldBe(0);
        body.MyVoteIsHelpful.ShouldBeNull();
    }

    [Fact]
    public async Task Voting_opposite_changes_vote()
    {
        var (author, reviewId) = await SetupAuthorWithReviewAsync(Subject111);
        var voter = await SetupUserWithProfileAsync("change");

        await voter.Client.PostAsJsonAsync($"/api/reviews/{reviewId}/vote", new { helpful = true });
        var changed = await voter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/vote", new { helpful = false });

        var body = await changed.Content.ReadFromJsonAsync<CastReviewVoteResponse>();
        body!.HelpfulCount.ShouldBe(0);
        body.NotHelpfulCount.ShouldBe(1);
        body.MyVoteIsHelpful.ShouldBe(false);
    }

    [Fact]
    public async Task Author_cannot_vote_own_review()
    {
        var (author, reviewId) = await SetupAuthorWithReviewAsync(Subject111);

        var resp = await author.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/vote", new { helpful = true });

        resp.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Cannot_vote_under_review()
    {
        var author = await SetupUserWithProfileAsync("dirty-author");
        var enrollmentId = await CreateApprovedEnrollmentAsync(author, Subject111);
        // "idiota" dispara el content filter -> la reseña queda UnderReview, no votable.
        var dirty = await author.Client.PostAsJsonAsync("/api/reviews", ReviewPayload(
            enrollmentId, text: "El profe es un idiota total y no responde nunca, mala experiencia."));
        var reviewId = (await dirty.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var voter = await SetupUserWithProfileAsync("voter-dirty");
        var resp = await voter.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/vote", new { helpful = true });

        resp.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_401_when_anonymous()
    {
        using var client = _fixture.Factory.CreateClient();
        var resp = await client.PostAsJsonAsync(
            $"/api/reviews/{Guid.NewGuid()}/vote", new { helpful = true });

        resp.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Browse_read_surfaces_counts_and_my_vote()
    {
        var (author, reviewId) = await SetupAuthorWithReviewAsync(Subject111);
        var voter = await SetupUserWithProfileAsync("browse-voter");
        await voter.Client.PostAsJsonAsync($"/api/reviews/{reviewId}/vote", new { helpful = true });

        // El votante ve helpfulCount=1 y myVote=true; un anónimo ve el conteo pero myVote=null.
        var mine = await voter.Client.GetFromJsonAsync<JsonElement>($"/api/reviews?subjectId={Subject111}");
        var row = mine.GetProperty("items").EnumerateArray()
            .First(i => i.GetProperty("id").GetGuid() == reviewId);
        row.GetProperty("helpfulCount").GetInt32().ShouldBe(1);
        row.GetProperty("myVoteIsHelpful").GetBoolean().ShouldBeTrue();

        using var anon = _fixture.Factory.CreateClient();
        var pub = await anon.GetFromJsonAsync<JsonElement>($"/api/reviews?subjectId={Subject111}");
        var pubRow = pub.GetProperty("items").EnumerateArray()
            .First(i => i.GetProperty("id").GetGuid() == reviewId);
        pubRow.GetProperty("helpfulCount").GetInt32().ShouldBe(1);
        pubRow.GetProperty("myVoteIsHelpful").ValueKind.ShouldBe(JsonValueKind.Null);
    }

    // -- helpers ------------------------------------------------------------

    private async Task<AuthenticatedClient> SetupUserWithProfileAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"vote-{label}.{Guid.NewGuid():N}@planb.local");
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles", new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
        return auth;
    }

    // Crea el author con profile, le publica una reseña sobre subjectId y devuelve ambos.
    private async Task<(AuthenticatedClient Author, Guid ReviewId)> SetupAuthorWithReviewAsync(
        Guid subjectId)
    {
        var author = await SetupUserWithProfileAsync("author");
        var enrollmentId = await CreateApprovedEnrollmentAsync(author, subjectId);
        var resp = await author.Client.PostAsJsonAsync("/api/reviews", ReviewPayload(enrollmentId));
        resp.StatusCode.ShouldBe(HttpStatusCode.Created);
        var reviewId = (await resp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();
        return (author, reviewId);
    }

    // Crea una cursada aprobada anclada a la comisión sembrada Cid01 (111 Desarrollo de Software ·
    // 2026·1c), reseñable por Brandt. El subjectId se ignora para mantener la firma estable en los
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
        return (await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>())!.Id;
    }

    private static object ReviewPayload(Guid enrollmentId, string? text = null) => new
    {
        enrollmentId,
        docenteResenadoId = TeacherBrandt,
        difficultyRating = 4,
        overallRating = 4,
        wouldRecommendCourse = true,
        wouldRetakeTeacher = true,
        subjectText = text ?? "Reseña de prueba para votos, contenido limpio y suficientemente largo.",
        teacherText = (string?)null,
        finalGrade = 8m,
    };

    private sealed record EnrollmentIdDto(Guid Id);
}
