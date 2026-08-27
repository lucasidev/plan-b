using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.SubjectFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/subjects/{subjectId}/facts</c> (US-129, ADR-0085): la
/// ficha de una materia contra la base real.
///
/// <para>
/// Lo que se prueba acá y no en el unit del calculador: que el read traiga a cada cátedra por
/// separado (la ficha existe para contrastarlas, así que sumarlas la rompería), que las cátedras
/// sin reseñas sigan apareciendo, y que la respuesta no filtre nada del modelo anterior.
/// </para>
/// </summary>
public class GetSubjectFactsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 211 Fundamentos de Control de Calidad: la única materia con cátedras sembradas.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");

    // 101: existe en el plan pero no tiene cátedras cargadas.
    private static readonly Guid Subject101 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");

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
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public GetSubjectFactsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>
    /// Publica reseñas sobre una cátedra, cada una con su cuenta. <paramref name="negative"/> dice
    /// cuántas de ellas eligen la opción mala del ítem de conducta: es lo que hace que dos cátedras
    /// difieran o no.
    /// </summary>
    private async Task PublishAsync(Guid chairId, int from, int count, int negative)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"subject-facts-{i}.{Guid.NewGuid():N}@planb.local");

            var profile = await auth.Client.PostAsJsonAsync(
                "/api/me/student-profiles",
                new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
            profile.EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/cursadas",
                new
                {
                    subjectId = Subject211,
                    termId = Terms[i % Terms.Length],
                    chairId = (Guid?)chairId,
                    answers = new[]
                    {
                        new { itemCode = "COURSE_OUTCOME", optionValue = i % 5 == 0 ? 3 : 1 },
                        new
                        {
                            itemCode = "CHAIR_ANSWERS_IN_CLASS",
                            optionValue = i - from < negative ? 3 : 1,
                        },
                    },
                    freeText = (string?)null,
                });
            published.StatusCode.ShouldBe(HttpStatusCode.Created);
        }
    }

    [Fact]
    public async Task An_unknown_subject_is_not_found()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/subjects/{Guid.NewGuid()}/facts");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task A_subject_without_chairs_exists_and_publishes_nothing()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/subjects/{Subject101}/facts");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetSubjectFactsResponse>();

        facts.ShouldNotBeNull();
        facts!.SubjectCode.ShouldNotBeNullOrWhiteSpace();
        facts.IsPublished.ShouldBeFalse();
        facts.Chairs.ShouldBeEmpty();
        facts.Spread.ShouldBeEmpty();
        facts.Shared.ShouldBeEmpty();
        facts.Completion.ShouldBeNull();
        facts.Span.ShouldBeNull();
    }

    /// <summary>
    /// El recorrido entero en un solo test, y no tres, a propósito: la ficha de una materia agrega
    /// TODO lo que hay sobre ella, así que dos tests que publiquen sobre la misma materia se
    /// contaminan siempre. Partirlo daría tests que pasan o fallan según el orden en que xUnit los
    /// corra, que es peor que un test largo.
    /// </summary>
    [Fact]
    public async Task The_subject_goes_from_empty_to_below_the_floor_to_answering_the_question()
    {
        // ---- Vacía: las cátedras existen pero ninguna tiene una sola reseña.
        var empty = await _anonymous.GetFromJsonAsync<GetSubjectFactsResponse>(
            $"/api/reviews/subjects/{Subject211}/facts");

        empty!.IsPublished.ShouldBeFalse();
        empty.Chairs.Count.ShouldBe(3);
        empty.Chairs.ShouldAllBe(c => c.ReviewCount == 0);
        empty.Completion.ShouldBeNull();
        empty.Span.ShouldBeNull();

        // ---- Bajo el piso: la cátedra se lista con lo que le falta, y no aporta a ningún número.
        await PublishAsync(ChairGonzalez, from: 0, count: 3, negative: 3);

        var below = await _anonymous.GetFromJsonAsync<GetSubjectFactsResponse>(
            $"/api/reviews/subjects/{Subject211}/facts");

        below!.IsPublished.ShouldBeFalse();
        below.TotalVoices.ShouldBe(0);
        below.Completion.ShouldBeNull();

        var waiting = below.Chairs.Single(c => c.ChairId == ChairGonzalez);
        waiting.ReviewCount.ShouldBe(3);
        waiting.IsPublished.ShouldBeFalse();
        waiting.ReviewsMissingToPublish.ShouldBe(7);

        // ---- Publicando: dos cátedras que se separan contestan la pregunta de la ficha.
        // González suma hasta 15 (3 negativas de 15) y Pérez entra con 12, 9 de ellas negativas.
        await PublishAsync(ChairGonzalez, from: 100, count: 12, negative: 0);
        await PublishAsync(ChairPerez, from: 200, count: 12, negative: 9);

        var facts = await _anonymous.GetFromJsonAsync<GetSubjectFactsResponse>(
            $"/api/reviews/subjects/{Subject211}/facts");

        facts!.IsPublished.ShouldBeTrue();
        facts.PublishingChairs.ShouldBe(2);
        facts.TotalVoices.ShouldBe(27);

        // La diferencia se publica con cada cátedra y su denominador: 75 % contra 20 %.
        var spread = facts.Spread.Single(s => s.ItemCode == "CHAIR_ANSWERS_IN_CLASS");
        spread.NegativeLabel.ShouldBe("Casi nunca");
        spread.ByChair.Count.ShouldBe(2);
        spread.ByChair[0].ChairId.ShouldBe(ChairPerez);
        spread.ByChair[0].Percent.ShouldBe(75);
        spread.ByChair[1].ChairId.ShouldBe(ChairGonzalez);
        spread.ByChair[1].Percent.ShouldBe(20);

        // Las cátedras se ordenan por voces y nunca por sus números: González tiene 15 y mejores
        // resultados, Pérez 12 y peores. Manda la cantidad de voces.
        facts.Chairs[0].ChairId.ShouldBe(ChairGonzalez);
        facts.Chairs[0].ReviewCount.ShouldBe(15);

        // Y la que sigue sin llegar al piso aparece igual, sin un solo conteo.
        facts.Chairs.ShouldContain(c => !c.IsPublished && c.ReviewCount == 0);

        facts.Completion.ShouldNotBeNull();
        facts.Completion!.Total.ShouldBe(27);
        facts.Span.ShouldNotBeNull();
    }

    [Fact]
    public async Task The_payload_never_carries_anything_from_the_previous_model()
    {
        var json = await _anonymous.GetStringAsync($"/api/reviews/subjects/{Subject211}/facts");

        // Ni puntaje, ni dificultad, ni recomendación, ni texto, ni quién reseñó.
        json.ShouldNotContain("overallRating");
        json.ShouldNotContain("difficulty");
        json.ShouldNotContain("wouldRecommend");
        json.ShouldNotContain("freeText");
        json.ShouldNotContain("@planb.local");
    }
}
