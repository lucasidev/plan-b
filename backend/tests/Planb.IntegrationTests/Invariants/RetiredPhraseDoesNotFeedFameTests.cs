using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Application.Features.Curation;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// Una frase retirada no alimenta fama ni contrastes, y los tramos de antes y después de un
/// corte no se suman (US-198 E/N): el código viejo deja de ofrecerse y de contar para nada
/// nuevo, pero lo que ya respondió se sigue mostrando aparte, con su propio total.
/// </summary>
public class RetiredPhraseDoesNotFeedFameTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez = Guid.Parse("00000008-0000-4000-a000-000000000002");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    /// <summary>La frase que este test corta. Con opciones, y se responde arriba (ver ChairFactsSeriesCutTests).</summary>
    private const string ItemBeingCut = "CHAIR_ANSWERS_IN_CLASS";

    /// <summary>
    /// Otras frases de ChairConduct que se responden junto con <see cref="ItemBeingCut"/> para que
    /// la fama tenga con qué converger: la fama pide al menos tres frases apuntando al mismo lado
    /// (no uno solo), así que cortar la única que se contestara la dejaría vacía sin que el corte
    /// tuviera nada que ver.
    /// </summary>
    private static readonly string[] OtherChairConductItems =
        ["CHAIR_CLASSES_HELD", "CHAIR_PRACTICE_MATCHES_THEORY", "CHAIR_ANSWERS_OUTSIDE_CLASS"];

    public RetiredPhraseDoesNotFeedFameTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync(string prefix, int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"{prefix}-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary><paramref name="negative"/> true responde la opción negativa (3) de cada frase; false, la positiva (1).</summary>
    private static async Task PublishAsync(
        AuthenticatedClient auth, Guid chairId, int termIndex, bool negative, params string[] itemCodes)
    {
        var value = (short)(negative ? 3 : 1);
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[termIndex % Terms.Length],
                chairId = (Guid?)chairId,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 } }
                    .Concat(itemCodes.Select(code => new { itemCode = code, optionValue = value })),
                freeText = (string?)null,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
    }

    private async Task<GetChairFactsResponse> FichaAsync(Guid chairId)
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{chairId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    [Fact]
    public async Task Superseding_an_item_excludes_it_from_fame_and_contrasts_without_summing_the_two_series()
    {
        var allItems = new[] { ItemBeingCut }.Concat(OtherChairConductItems).ToArray();

        // Perez converge fuerte en la negativa en las cuatro; Gonzalez, la hermana, converge
        // fuerte en la opuesta: si el cálculo de fama o de contraste llega a mirar el código
        // retirado, acá tiene motivo de sobra para hacerlo.
        for (var i = 0; i < 10; i++)
        {
            await PublishAsync(await AccountAsync("cut-perez", i), ChairPerez, i, negative: true, allItems);
        }
        for (var i = 0; i < 10; i++)
        {
            await PublishAsync(await AccountAsync("cut-gonzalez", i), ChairGonzalez, i, negative: false, allItems);
        }

        var admin = await AuthenticatedClient.CreateAsync(
            _fixture, $"cut-fame-admin-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

        var catalog = await admin.Client.GetFromJsonAsync<GetItemsResponse>("/api/reviews/curation/items");
        catalog.ShouldNotBeNull();
        var item = catalog!.Items.Single(i => i.Code == ItemBeingCut);

        var newCode = $"{ItemBeingCut}_FAME";
        var supersede = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            new
            {
                code = newCode,
                text = "¿Contestaba las consultas en el horario de clase?",
                help = (string?)null,
                layer = item.Layer,
                options = item.Options.Select(o => new
                {
                    value = o.Value,
                    order = o.Order,
                    label = o.Label,
                    valence = o.Valence,
                }),
            });
        supersede.StatusCode.ShouldBe(HttpStatusCode.Created, await supersede.Content.ReadAsStringAsync());

        // Después del corte, Perez suma tres respuestas más al código nuevo: si algo sumara los
        // dos tramos, el total de la frase de hoy pasaría a ser 13 en vez de 3.
        await PublishAsync(await AccountAsync("cut-perez-new", 10), ChairPerez, 10, negative: true, newCode);
        await PublishAsync(await AccountAsync("cut-perez-new", 11), ChairPerez, 11, negative: false, newCode);
        await PublishAsync(await AccountAsync("cut-perez-new", 12), ChairPerez, 12, negative: false, newCode);

        var facts = await FichaAsync(ChairPerez);
        facts.IsPublished.ShouldBeTrue();

        // El código viejo no aparece como una frase más entre las que se publican.
        facts.ChairConduct.Select(i => i.Code).ShouldNotContain(ItemBeingCut);
        facts.StudentExperience.Select(i => i.Code).ShouldNotContain(ItemBeingCut);

        // Ni entre lo que converge: con las otras tres todavía apuntando fuerte al mismo lado, la
        // fama sigue de pie, y el código retirado no puede ser una de ellas.
        var fame = facts.Fame.ShouldNotBeNull();
        fame.Items.Select(i => i.Code).ShouldNotContain(ItemBeingCut);

        // ...ni en los contrastes contra la hermana.
        facts.Contrasts.ShouldNotBeEmpty();
        facts.Contrasts.Select(c => c.ItemCode).ShouldNotContain(ItemBeingCut);

        // El tramo de hoy es el suyo propio, no la suma con el de ayer.
        var today = facts.ChairConduct.Concat(facts.StudentExperience).Single(i => i.Code == newCode);
        today.Total.ShouldBe(3);

        var previous = today.PreviousSeries.ShouldNotBeNull();
        previous.Code.ShouldBe(ItemBeingCut);
        previous.Total.ShouldBe(10);
    }
}
