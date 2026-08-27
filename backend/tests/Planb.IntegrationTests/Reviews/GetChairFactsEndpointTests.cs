using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/chairs/{chairId}/facts</c> (US-147, ADR-0083): la
/// ficha de una cátedra contra la base real.
///
/// <para>
/// Lo que se prueba acá y no en el unit del calculador: que el read cuente bien (denominadores por
/// ítem, opciones en cero presentes) y que la respuesta HTTP no filtre nada de lo que la tesis
/// prohíbe publicar. El juicio editorial ya está probado sin base en
/// <c>ChairFactsCalculatorTests</c>.
/// </para>
/// </summary>
public class GetChairFactsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    // Los tests de esta clase comparten la base (IClassFixture), y xUnit no garantiza el orden en
    // que corren. Por eso cada uno trabaja sobre SU cátedra: el que cuenta reseñas exactas no puede
    // compartir sujeto con los que publican para otra cosa, o el corpus le llega contaminado.
    private static readonly Guid ChairRuiz =
        Guid.Parse("00000008-0000-4000-a000-000000000003");
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

    public GetChairFactsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>
    /// Publica reseñas sobre Ruiz, cada una con su propia cuenta (una voz por cuenta, materia y
    /// período). El desenlace alterna para que la tasa de finalización no dé un número redondo por
    /// accidente.
    ///
    /// <para>
    /// El índice va de <paramref name="from"/> a <paramref name="from"/> + <paramref name="count"/>
    /// y no arranca en cero cada vez: es lo que hace que publicar 9 y después 1 dé exactamente el
    /// mismo corpus que publicar 10 de una, y que los porcentajes esperados se puedan calcular a
    /// mano sin depender de en cuántas tandas se hizo.
    /// </para>
    /// </summary>
    private async Task PublishAsync(Guid chairId, int from, int count)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"facts-{i}.{Guid.NewGuid():N}@planb.local");

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
                        // Siete aprueban, tres recursan: 7 de cada 10 llegan.
                        new { itemCode = "COURSE_OUTCOME", optionValue = i < 7 ? 1 : 3 },
                        // Ocho de diez eligen la negativa de este ítem.
                        new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = i < 8 ? 3 : 1 },
                    },
                    freeText = (string?)null,
                });
            published.StatusCode.ShouldBe(HttpStatusCode.Created);
        }
    }

    [Fact]
    public async Task An_unknown_chair_is_not_found()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{Guid.NewGuid()}/facts");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task A_chair_without_reviews_exists_and_asks_for_the_whole_floor()
    {
        // González no recibe reseñas en ningún test de esta clase: es el sujeto virgen.
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{ChairGonzalez}/facts");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();

        facts.ShouldNotBeNull();
        facts!.ChairName.ShouldBe("González");
        facts.SubjectName.ShouldBe("Fundamentos de Control de Calidad");
        facts.IsPublished.ShouldBeFalse();
        facts.ReviewCount.ShouldBe(0);
        facts.ReviewsMissingToPublish.ShouldBe(10);

        // Bajo el piso no viaja un solo conteo: si viajaran, la pantalla podría mostrarlos.
        facts.ChairConduct.ShouldBeEmpty();
        facts.StudentExperience.ShouldBeEmpty();
        facts.Completion.ShouldBeNull();
        facts.Fame.ShouldBeNull();
        facts.Span.ShouldBeNull();
    }

    [Fact]
    public async Task The_tenth_review_is_what_publishes_the_ficha()
    {
        await PublishAsync(ChairRuiz, 0, 9);

        var below = await _anonymous.GetFromJsonAsync<GetChairFactsResponse>(
            $"/api/reviews/chairs/{ChairRuiz}/facts");
        below!.IsPublished.ShouldBeFalse();
        below.ReviewCount.ShouldBe(9);
        below.ReviewsMissingToPublish.ShouldBe(1);
        below.ChairConduct.ShouldBeEmpty();

        await PublishAsync(ChairRuiz, 9, 1);

        var published = await _anonymous.GetFromJsonAsync<GetChairFactsResponse>(
            $"/api/reviews/chairs/{ChairRuiz}/facts");
        published!.IsPublished.ShouldBeTrue();
        published.ReviewCount.ShouldBe(10);
        published.ReviewsMissingToPublish.ShouldBe(0);
        published.ChairConduct.ShouldNotBeEmpty();

        // La moda con su etiqueta literal y su porcentaje, recalculados a mano: de las diez
        // respuestas, ocho eligieron "Casi nunca".
        var item = published.ChairConduct.Single(i => i.Code == "CHAIR_ANSWERS_IN_CLASS");
        item.ModeLabel.ShouldBe("Casi nunca");
        item.ModePercent.ShouldBe(80);
        item.ModeIsNegative.ShouldBeTrue();
        item.Total.ShouldBe(10);

        // La distribución llega completa, con las opciones que nadie eligió: un cero es
        // información ("nadie marcó 'a veces'"), no una fila para omitir.
        item.Distribution.Count.ShouldBe(4);
        item.Distribution.Single(d => d.Label == "Siempre").Percent.ShouldBe(20);
        item.Distribution.Single(d => d.Label == "A veces").Percent.ShouldBe(0);
        item.Distribution.Count(d => d.IsNegative).ShouldBe(1);

        // La tasa de finalización, agregada: siete de diez aprobaron.
        published.Completion.ShouldNotBeNull();
        published.Completion!.OutOfTen.ShouldBe(7);
        published.Completion.Total.ShouldBe(10);

        // Y el sustento temporal, que dice de cuándo son esas voces.
        published.Span.ShouldNotBeNull();
        published.Span!.FromYear.ShouldBeLessThanOrEqualTo(published.Span.ToYear);
    }

    [Fact]
    public async Task The_denominator_of_an_item_is_its_own_answers_not_the_review_count()
    {
        await PublishAsync(ChairPerez, 0, 10);

        // El ítem que nadie contestó no aparece publicado: saltear no deja fila, así que no entra
        // en ningún denominador (ADR-0082). Si apareciera con total 0, la ficha estaría inventando
        // un denominador que nadie sostiene.
        var facts = await _anonymous.GetFromJsonAsync<GetChairFactsResponse>(
            $"/api/reviews/chairs/{ChairPerez}/facts");

        facts!.ChairConduct.ShouldNotContain(i => i.Code == "CHAIR_CLASSES_HELD");
        facts.ChairConduct.ShouldAllBe(i => i.Total > 0);
        facts.StudentExperience.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_payload_never_carries_who_reviewed_or_how_anyone_finished()
    {
        await PublishAsync(ChairPerez, 0, 10);

        var json = await _anonymous.GetStringAsync($"/api/reviews/chairs/{ChairPerez}/facts");

        // Nada de quién reseñó (US-148): ni cuentas, ni ids de reseña, ni texto libre.
        json.ShouldNotContain("@planb.local");
        json.ShouldNotContain("accountId");
        json.ShouldNotContain("freeText");

        // Y ningún desenlace individual: la capa de contexto no se publica ítem por ítem, solo
        // agregada como tasa de finalización.
        using var document = JsonDocument.Parse(json);
        var codes = document.RootElement.GetProperty("chairConduct").EnumerateArray()
            .Concat(document.RootElement.GetProperty("studentExperience").EnumerateArray())
            .Select(i => i.GetProperty("code").GetString())
            .ToList();

        codes.ShouldNotContain("COURSE_OUTCOME");
        codes.ShouldNotContain("COURSE_MODALITY");
        codes.ShouldNotContain("COURSE_ATTEMPTS");
    }
}
