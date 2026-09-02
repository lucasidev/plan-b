using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Application.Features.Curation;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// El corte de serie visto desde la ficha pública (US-198, E3).
///
/// <para>
/// Es el recorrido entero contra la base real: se reseña, se cambia lo que la pregunta pregunta, y
/// la ficha tiene que mostrar los dos tramos separados en vez de perder de vista lo que se
/// respondió bajo el código viejo. Toca la FK del sucesor, el join que la resuelve y el cálculo
/// editorial, y ninguno de los tres se puede probar sin los otros dos.
/// </para>
///
/// <para>
/// Clase aparte, con su propia base, porque retira una frase del catálogo sembrado: hacerlo en una
/// clase compartida le cambiaría el corpus a los tests de al lado.
/// </para>
/// </summary>
public class ChairFactsSeriesCutTests : IClassFixture<RegisterApiFixture>
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

    /// <summary>La frase que este test cambia de significado. Tiene opciones y se responde arriba.</summary>
    private const string ItemBeingCut = "CHAIR_ANSWERS_IN_CLASS";

    public ChairFactsSeriesCutTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>Diez reseñas, que es justo el piso: menos y la ficha no publica nada que mirar.</summary>
    private async Task PublishTenAsync()
    {
        for (var i = 0; i < 10; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"cut-{i}.{Guid.NewGuid():N}@planb.local");

            (await auth.Client.PostAsJsonAsync(
                "/api/me/student-profiles",
                new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
                .EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/courses",
                new
                {
                    subjectId = Subject211,
                    termId = Terms[i % Terms.Length],
                    chairId = (Guid?)ChairPerez,
                    answers = new[]
                    {
                        new { itemCode = "COURSE_OUTCOME", optionValue = i < 7 ? 1 : 3 },
                        // Ocho de diez eligen la negativa: la moda del tramo viejo es "casi nunca".
                        new { itemCode = ItemBeingCut, optionValue = i < 8 ? 3 : 1 },
                    },
                    freeText = (string?)null,
                });
            published.StatusCode.ShouldBe(HttpStatusCode.Created);
        }
    }

    private async Task<GetChairFactsResponse> FichaAsync()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");

        // El cuerpo va en el mensaje de la aserción: un 500 acá sale de la materialización de la
        // query, y sin el detalle el test solo dice "no fue 200", que no alcanza para arreglarlo.
        response.StatusCode.ShouldBe(
            HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>
    /// US-198 E3, de punta a punta: lo de antes queda bajo el código viejo con su propio enunciado y
    /// su propio total, lo de después bajo el nuevo, y la ficha los publica separados.
    /// </summary>
    [Fact]
    public async Task After_the_cut_the_ficha_still_shows_what_was_answered_under_the_old_code()
    {
        await PublishTenAsync();

        // Antes del corte: un solo tramo, con sus diez voces y sin historia colgando.
        var before = FindItem(await FichaAsync(), ItemBeingCut);
        before.Total.ShouldBe(10);
        before.ModeIsNegative.ShouldBeTrue();
        before.PreviousSeries.ShouldBeNull();
        var oldText = before.Text;

        // Y ahora cambia lo que la pregunta pregunta.
        var admin = await AuthenticatedClient.CreateAsync(
            _fixture, $"cut-admin-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

        var catalog = await admin.Client.GetFromJsonAsync<GetItemsResponse>(
            "/api/reviews/curation/items");
        var item = catalog!.Items.Single(i => i.Code == ItemBeingCut);

        var newCode = $"{ItemBeingCut}_B";
        var cut = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            new
            {
                code = newCode,
                text = "¿Respondía las consultas fuera del horario de clase?",
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
        cut.StatusCode.ShouldBe(HttpStatusCode.Created);

        // Después del corte: la pregunta de hoy todavía no la contestó nadie, y aun así las diez
        // respuestas de antes se siguen publicando, debajo, con su enunciado original.
        var after = FindItem(await FichaAsync(), newCode);
        after.Text.ShouldBe("¿Respondía las consultas fuera del horario de clase?");
        after.Total.ShouldBe(0);

        var previous = after.PreviousSeries.ShouldNotBeNull();
        previous.Code.ShouldBe(ItemBeingCut);
        previous.Text.ShouldBe(oldText);
        previous.Total.ShouldBe(10);
        previous.ModeIsNegative.ShouldBeTrue();
        previous.RetiredAt.ShouldNotBeNull(); // la fecha del corte, que la ficha enuncia

        // Y el código viejo no aparece como una frase más: existe solo como el tramo de antes.
        var ficha = await FichaAsync();
        ficha.ChairConduct.Select(i => i.Code).ShouldNotContain(ItemBeingCut);
        ficha.StudentExperience.Select(i => i.Code).ShouldNotContain(ItemBeingCut);
    }

    private static PublishedItemView FindItem(GetChairFactsResponse facts, string code) =>
        facts.ChairConduct
            .Concat(facts.StudentExperience)
            .Single(i => i.Code == code);
}
