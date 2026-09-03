using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Application.Features.PublishReview;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// El piso de una cátedra se cuenta en el momento de leer, nunca desde una proyección con lag
/// (ADR-0087 punto 3): un número viejo publicaría una cátedra que todavía no cruzó el piso, y
/// eso expone a quien reseñó.
/// </summary>
public class FloorIsCountedLiveTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public FloorIsCountedLiveTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync(int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"floor-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task<Guid> ReviewAsync(AuthenticatedClient auth, int index)
    {
        var published = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[index % Terms.Length],
                chairId = (Guid?)ChairPerez,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = 1 } },
                freeText = (string?)null,
            });
        published.StatusCode.ShouldBe(HttpStatusCode.Created, await published.Content.ReadAsStringAsync());

        var body = await published.Content.ReadFromJsonAsync<PublishReviewResponse>();
        body.ShouldNotBeNull();
        return body!.Id;
    }

    private async Task<GetChairFactsResponse> FichaAsync()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>
    /// Nueve no cruzan el piso, la décima lo cruza, borrar esa misma reseña la vuelve a bajar del
    /// piso en la lectura siguiente, y volver a sumar hasta once la deja publicada de nuevo. Cada
    /// paso lee fresco: nada de esto se sostiene si el conteo viene de un valor cacheado o de una
    /// proyección con lag.
    /// </summary>
    [Fact]
    public async Task Facts_recompute_the_floor_on_every_read_as_reviews_are_added_and_removed()
    {
        for (var i = 0; i < 9; i++)
        {
            await ReviewAsync(await AccountAsync(i), i);
        }

        var underFloor = await FichaAsync();
        underFloor.IsPublished.ShouldBeFalse();
        underFloor.ReviewsMissingToPublish.ShouldBe(1);

        var tenthAuthor = await AccountAsync(9);
        var tenthReviewId = await ReviewAsync(tenthAuthor, 9);

        var atFloor = await FichaAsync();
        atFloor.IsPublished.ShouldBeTrue();
        atFloor.ReviewCount.ShouldBe(10);

        // Borro justo la que cruzó el piso: con nueve, la ficha tiene que volver a decir que no
        // publica, en la lectura siguiente, sin ningún paso intermedio que la "avise".
        var deleted = await tenthAuthor.Client.DeleteAsync($"/api/reviews/courses/{tenthReviewId}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var backUnderFloor = await FichaAsync();
        backUnderFloor.IsPublished.ShouldBeFalse();
        backUnderFloor.ReviewsMissingToPublish.ShouldBe(1);

        for (var i = 10; i < 12; i++)
        {
            await ReviewAsync(await AccountAsync(i), i);
        }

        var aboveFloor = await FichaAsync();
        aboveFloor.IsPublished.ShouldBeTrue();
        aboveFloor.ReviewCount.ShouldBe(11);
    }
}
