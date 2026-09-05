using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

// Ver sobre cuántas voces se calcula (US-131): cada frase publicada lleva su propio "de N", que no
// se completa con las voces de otra frase ni se pierde cuando la ficha resume una proporción. Cada
// escenario tiene su propia clase (y su propia base, vía RegisterApiFixture): las dos publican
// sobre la misma cátedra sembrada, y compartir clase las contaminaría entre sí.

/// <summary>Fixture compartido de este archivo: cuentas y publicar sobre una cátedra dada.</summary>
file static class Fixture
{
    public static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    public static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");

    public static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public static async Task PublishAsync(
        RegisterApiFixture fixture,
        Guid chairId,
        int index,
        params (string ItemCode, short OptionValue)[] answers)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            fixture, $"voicecount-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[index % Terms.Length],
                chairId = (Guid?)chairId,
                answers = answers.Select(a => new { itemCode = a.ItemCode, optionValue = a.OptionValue }),
                freeText = (string?)null,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
    }
}

public class EachBlockKeepsItsOwnDenominatorTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    public EachBlockKeepsItsOwnDenominatorTests(RegisterApiFixture fixture) => _fixture = fixture;

    /// <summary>US-131 N1</summary>
    [Fact]
    public async Task Each_block_keeps_its_own_denominator_without_borrowing_from_the_other()
    {
        // Diez cursadas contestan "qué hizo la cátedra" (CHAIR_CLASSES_HELD, ChairConduct); solo
        // ocho de esas diez contestan también "qué te pasó a vos" (STUDENT_UNDERSTOOD_IN_CLASS,
        // StudentExperience). Misma ficha, dos bloques, dos denominadores distintos.
        for (var i = 0; i < 8; i++)
        {
            await Fixture.PublishAsync(
                _fixture, ChairPerez, i,
                ("CHAIR_CLASSES_HELD", (short)1), ("STUDENT_UNDERSTOOD_IN_CLASS", (short)1));
        }
        for (var i = 8; i < 10; i++)
        {
            await Fixture.PublishAsync(_fixture, ChairPerez, i, ("CHAIR_CLASSES_HELD", (short)1));
        }

        var anonymous = _fixture.Factory.CreateClient();
        var response = await anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();

        var conduct = facts!.ChairConduct.Single(i => i.Code == "CHAIR_CLASSES_HELD");
        var experience = facts.StudentExperience.Single(i => i.Code == "STUDENT_UNDERSTOOD_IN_CLASS");

        // Cada bloque lleva su propio "de N": el de conducta no se completa con las diez voces de
        // la cursada entera, ni el de vivencia toma prestado el denominador del otro bloque.
        conduct.Total.ShouldBe(10);
        experience.Total.ShouldBe(8);
    }
}

public class FameStatesItsOwnVoiceCountTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private static readonly Guid ChairRuiz = Guid.Parse("00000008-0000-4000-a000-000000000003");

    public FameStatesItsOwnVoiceCountTests(RegisterApiFixture fixture) => _fixture = fixture;

    /// <summary>
    /// US-131 N2: ninguna proporción se publica sin su "de N" al lado. La fama resume una frase
    /// con su porcentaje ("el 100 % dijo que faltaron muchas clases") y tiene que poder decirse sin
    /// bajar al detalle; si hay que ir a buscar el conteo a otro bloque de la ficha, el porcentaje
    /// quedó solo.
    /// </summary>
    [Fact(Skip = "Roto: #439")]
    public async Task Fame_never_states_a_percentage_without_its_own_voice_count()
    {
        // Diez cursadas marcan la opción negativa de tres frases de conducta distintas: las tres
        // convergen (100 % > el 50 % de ADR-0083) y arman la fama.
        for (var i = 0; i < 10; i++)
        {
            await Fixture.PublishAsync(
                _fixture, ChairRuiz, i,
                ("CHAIR_ANSWERS_IN_CLASS", (short)3),
                ("CHAIR_CLASSES_HELD", (short)3),
                ("CHAIR_PRACTICE_MATCHES_THEORY", (short)3));
        }

        var anonymous = _fixture.Factory.CreateClient();
        var json = await anonymous.GetStringAsync($"/api/reviews/chairs/{ChairRuiz}/facts");
        using var document = JsonDocument.Parse(json);
        var fame = document.RootElement.GetProperty("fame");
        var items = fame.GetProperty("items").EnumerateArray().ToList();

        // Las tres frases convergieron: la fama tiene algo que decir.
        items.Count.ShouldBe(3);

        foreach (var item in items)
        {
            item.TryGetProperty("percent", out _).ShouldBeTrue("la fama tiene que traer el porcentaje");
            item.TryGetProperty("total", out _).ShouldBeTrue(
                $"la fama publica \"{item.GetProperty("text").GetString()}\" con un porcentaje " +
                "y sin su propio \"de N\" al lado (US-131): un porcentaje sin voces detrás es " +
                "exactamente lo que la story prohíbe.");
        }
    }
}
