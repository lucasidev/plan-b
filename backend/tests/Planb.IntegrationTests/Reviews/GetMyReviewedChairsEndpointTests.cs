using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.MyReviewedChairs;
using Planb.Reviews.Domain.CourseReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/chairs/mine</c> (US-231): las cátedras que una cuenta
/// reseñó, con las voces de cada una.
///
/// <para>
/// Lo que se prueba acá y no en un unit: que el conteo sea el de la cátedra <b>entera</b> y no el
/// de lo que aportó quien pregunta, que es la diferencia que hace útil a la pantalla; que la
/// cuenta salga del token y no de un parámetro; y que la reseña sin cátedra no produzca fila.
/// </para>
/// </summary>
public class GetMyReviewedChairsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 211 Fundamentos de Control de Calidad: la única materia con cátedras sembradas.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");

    private static readonly Guid ChairPerez =
        Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez =
        Guid.Parse("00000008-0000-4000-a000-000000000002");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
    ];

    public GetMyReviewedChairsEndpointTests(RegisterApiFixture fixture) => _fixture = fixture;

    private async Task<AuthenticatedClient> AccountWithProfileAsync()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"my-chairs-{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task ReviewAsync(
        AuthenticatedClient auth, Guid? chairId, int termIndex)
    {
        var published = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            new
            {
                subjectId = Subject211,
                termId = Terms[termIndex % Terms.Length],
                chairId,
                answers = new[]
                {
                    new { itemCode = "COURSE_OUTCOME", optionValue = 1 },
                    new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = 1 },
                },
                freeText = (string?)null,
            });
        published.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Requires_a_session()
    {
        var anonymous = _fixture.Factory.CreateClient();

        var response = await anonymous.GetAsync("/api/reviews/chairs/mine");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task An_account_that_reviewed_nothing_gets_an_empty_list()
    {
        var auth = await AccountWithProfileAsync();

        var response = await auth.Client.GetAsync("/api/reviews/chairs/mine");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var chairs = await response.Content.ReadFromJsonAsync<List<MyReviewedChairResponse>>();
        chairs.ShouldNotBeNull();
        chairs.ShouldBeEmpty();
    }

    /// <summary>
    /// El recorrido entero en un test y no en cuatro, mismo criterio que
    /// <see cref="GetCareerFactsEndpointTests"/>: los conteos de una cátedra son globales, así que
    /// dos tests que publiquen sobre la misma se contaminan según el orden en que xUnit los corra.
    /// </summary>
    [Fact]
    public async Task Counts_the_whole_chair_and_not_only_what_i_contributed()
    {
        var mine = await AccountWithProfileAsync();
        await ReviewAsync(mine, ChairPerez, 0);

        var before = await mine.Client.GetFromJsonAsync<List<MyReviewedChairResponse>>(
            "/api/reviews/chairs/mine");
        before.ShouldNotBeNull();

        var perez = before.ShouldHaveSingleItem();
        perez.ChairId.ShouldBe(ChairPerez);
        var countWithOnlyMine = perez.ReviewCount;
        countWithOnlyMine.ShouldBeGreaterThanOrEqualTo(1);

        // Otra cuenta reseña la MISMA cátedra: mi conteo tiene que moverse, porque lo que hace
        // publicar a una cátedra es su total y mi aporte es una de esas voces.
        var other = await AccountWithProfileAsync();
        await ReviewAsync(other, ChairPerez, 1);

        var after = await mine.Client.GetFromJsonAsync<List<MyReviewedChairResponse>>(
            "/api/reviews/chairs/mine");
        after.ShouldNotBeNull();
        after.ShouldHaveSingleItem().ReviewCount.ShouldBe(countWithOnlyMine + 1);

        // Y la cátedra que reseñó el otro y yo no, no aparece en mi lista.
        await ReviewAsync(other, ChairGonzalez, 2);

        var stillMine = await mine.Client.GetFromJsonAsync<List<MyReviewedChairResponse>>(
            "/api/reviews/chairs/mine");
        stillMine.ShouldNotBeNull();
        stillMine.ShouldHaveSingleItem().ChairId.ShouldBe(ChairPerez);
    }

    [Fact]
    public async Task A_review_without_a_chair_produces_no_row()
    {
        var auth = await AccountWithProfileAsync();
        await ReviewAsync(auth, chairId: null, termIndex: 3);

        var chairs = await auth.Client.GetFromJsonAsync<List<MyReviewedChairResponse>>(
            "/api/reviews/chairs/mine");

        chairs.ShouldNotBeNull();
        chairs.ShouldBeEmpty();
    }

    [Fact]
    public async Task Below_the_floor_it_says_how_many_are_missing_and_never_a_negative()
    {
        var auth = await AccountWithProfileAsync();
        await ReviewAsync(auth, ChairGonzalez, 0);

        var chairs = await auth.Client.GetFromJsonAsync<List<MyReviewedChairResponse>>(
            "/api/reviews/chairs/mine");
        chairs.ShouldNotBeNull();

        // El piso llega de la constante del dominio y no como literal: un 10 escrito acá sería
        // una segunda definición de la regla, y al cambiar la primera este test fallaría como si
        // se hubiera roto el código.
        var floor = PublishingRules.ChairMinimumReviews;

        var gonzalez = chairs.ShouldHaveSingleItem();
        gonzalez.IsPublished.ShouldBe(gonzalez.ReviewCount >= floor);
        gonzalez.ReviewsMissingToPublish.ShouldBe(
            gonzalez.IsPublished ? 0 : floor - gonzalez.ReviewCount);
    }
}
