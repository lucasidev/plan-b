using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Application.Features.SubjectFacts;
using Planb.Reviews.Application.Seeding;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// El corpus de demostración produce exactamente los conteos que declara (#374).
///
/// <para>
/// Es lo que lo hace servir para lo que existe: un corpus sirve para demostrar el producto solo si
/// los números que muestra la ficha se pueden verificar contra lo sembrado. Si el manifiesto dice
/// "14 voces, 7 faltaron muchas" y la ficha dice otra cosa, el que falla puede ser cualquiera de
/// los dos, y en una demostración eso no se puede averiguar.
/// </para>
///
/// <para>
/// El corpus va gateado por <c>PLANB_SEED_CORPUS</c> y los integration tests corren sin esa
/// variable, así que este test lo siembra a mano pidiéndole el seeder al contenedor. La base es la
/// de su propia clase, así que no le deja reseñas a nadie más.
/// </para>
/// </summary>
public class CorpusSeedTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez = Guid.Parse("00000008-0000-4000-a000-000000000002");
    private static readonly Guid ChairRuiz = Guid.Parse("00000008-0000-4000-a000-000000000003");
    private static readonly Guid ChairIbanez = Guid.Parse("00000008-0000-4000-a000-000000000004");
    private static readonly Guid ChairDominguez = Guid.Parse("00000008-0000-4000-a000-000000000006");
    private static readonly Guid ChairAraoz = Guid.Parse("00000008-0000-4000-a000-000000000007");
    private static readonly Guid ChairBravo = Guid.Parse("00000008-0000-4000-a000-000000000008");
    private static readonly Guid Subject102 = Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Subject103 = Guid.Parse("00000004-0000-4000-a000-000000000003");
    private static readonly Guid Subject104 = Guid.Parse("00000004-0000-4000-a000-000000000004");
    private static readonly Guid Subject111 = Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Subject113 = Guid.Parse("00000004-0000-4000-a000-000000000006");

    public CorpusSeedTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<CorpusSeeder>();
        await seeder.SeedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<GetChairFactsResponse> ChairAsync(Guid chairId)
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{chairId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    private async Task<GetSubjectFactsResponse> SubjectAsync(Guid subjectId)
    {
        var response = await _anonymous.GetAsync($"/api/reviews/subjects/{subjectId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetSubjectFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>
    /// Sembrar dos veces no duplica: la clave natural de una cursada es (cuenta, materia, período),
    /// y el seeder busca por ella antes de insertar (ADR-0058). Sin esto, cada arranque de `just
    /// dev` inflaría los conteos y la ficha diría cualquier cosa.
    /// </summary>
    [Fact]
    public async Task Seeding_twice_does_not_duplicate_a_single_review()
    {
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<CorpusSeeder>().SeedAsync();
        }

        (await ChairAsync(ChairPerez)).ReviewCount.ShouldBe(14);
    }

    /// <summary>
    /// La cátedra que publica dice sus 14 voces y la moda que el manifiesto declara: 7 de 14
    /// marcaron que faltaron muchas clases, que es el 50 %.
    /// </summary>
    [Fact]
    public async Task The_chair_over_the_floor_publishes_the_counts_the_corpus_declares()
    {
        var facts = await ChairAsync(ChairPerez);

        facts.IsPublished.ShouldBeTrue();
        facts.ReviewCount.ShouldBe(14);
        facts.ReviewsMissingToPublish.ShouldBe(0);

        var item = facts.ChairConduct.Single(i => i.Code == "CHAIR_CLASSES_HELD");
        item.Total.ShouldBe(14);
        item.ModeLabel.ShouldBe("Faltaron muchas");
        item.ModePercent.ShouldBe(50);
    }

    /// <summary>
    /// La hermana existe para que la comparación tenga contra qué: mismas materia y período, y el
    /// número dado vuelta.
    /// </summary>
    [Fact]
    public async Task The_sibling_chair_publishes_the_other_side_of_the_comparison()
    {
        var facts = await ChairAsync(ChairGonzalez);

        facts.IsPublished.ShouldBeTrue();
        facts.ReviewCount.ShouldBe(12);

        var item = facts.ChairConduct.Single(i => i.Code == "CHAIR_CLASSES_HELD");
        item.Total.ShouldBe(12);
        item.ModeLabel.ShouldBe("Casi todas");
    }

    /// <summary>
    /// Y la que no llega se muestra igual, con cuánto junta y cuánto le falta (ADR-0082). El estado
    /// "bajo el piso" hay que poder verlo, no solo el estado publicado.
    /// </summary>
    [Fact]
    public async Task The_chair_under_the_floor_says_how_many_it_is_missing()
    {
        var facts = await ChairAsync(ChairRuiz);

        facts.IsPublished.ShouldBeFalse();
        facts.ReviewCount.ShouldBe(6);
        facts.ReviewsMissingToPublish.ShouldBe(4);
    }

    /// <summary>
    /// La co-cursada, de los dos lados del piso: el par con 111 publica sus dos números, y el otro
    /// se queda corto y lo dice.
    /// </summary>
    [Fact]
    public async Task The_pair_counts_land_on_both_sides_of_the_floor()
    {
        var response = await _anonymous.GetAsync(
            $"/api/reviews/subjects/{CorpusSeedData.Subject211}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetSubjectFactsResponse>();
        facts.ShouldNotBeNull();

        var published = facts!.TakenWith.Single(p => p.SubjectId == Subject111);
        published.TogetherCount.ShouldBe(12);
        published.IsPublished.ShouldBeTrue();
        published.DroppedCount.ShouldBe(3);

        // El otro par existe y se muestra con cuánto le falta, no se esconde.
        var under = facts.TakenWith.Single(p => p.SubjectId != Subject111);
        under.TogetherCount.ShouldBe(5);
        under.IsPublished.ShouldBeFalse();
        under.MissingToPublish.ShouldBe(5);
    }

    /// <summary>
    /// Ibáñez (111) es la cátedra nueva con más voces, hecha a propósito para que tres frases
    /// converjan del lado malo y la fama aparezca: si el estado desaparece del corpus (por ejemplo
    /// porque alguna distribución bajó de la mitad), este test cae.
    /// </summary>
    [Fact]
    public async Task The_chair_with_many_voices_has_fame_by_convergence()
    {
        var facts = await ChairAsync(ChairIbanez);

        facts.IsPublished.ShouldBeTrue();
        facts.ReviewCount.ShouldBe(16);
        facts.Fame.ShouldNotBeNull();
        facts.Fame!.ItemsAgreeing.ShouldBeGreaterThanOrEqualTo(3);
        facts.Fame.Items.Select(i => i.Code).ShouldContain("CHAIR_CLASSES_HELD");
    }

    /// <summary>
    /// El par del piso exacto (Domínguez, 10 voces) y el que le falta una sola (Bravo, 9) en un solo
    /// test: si cualquiera de los dos estados desaparece, el test cae acá y no en una lectura suelta.
    /// </summary>
    [Fact]
    public async Task The_chair_exactly_at_the_floor_publishes_and_the_one_short_by_one_does_not()
    {
        var atFloor = await ChairAsync(ChairDominguez);
        atFloor.IsPublished.ShouldBeTrue();
        atFloor.ReviewCount.ShouldBe(10);
        atFloor.ReviewsMissingToPublish.ShouldBe(0);

        var oneShort = await ChairAsync(ChairBravo);
        oneShort.IsPublished.ShouldBeFalse();
        oneShort.ReviewCount.ShouldBe(9);
        oneShort.ReviewsMissingToPublish.ShouldBe(1);
    }

    /// <summary>
    /// Aráoz (122) es la única cátedra de su materia (sin hermanas, sin contrastes) y donde vive el
    /// corte de serie: la frase vieja aparece colgada de la nueva, con su propio total y su fecha de
    /// retiro, sin mezclarse en el mismo conteo (US-198, E3).
    /// </summary>
    [Fact]
    public async Task The_only_chair_of_its_subject_publishes_the_series_cut()
    {
        var facts = await ChairAsync(ChairAraoz);

        facts.IsPublished.ShouldBeTrue();
        facts.ReviewCount.ShouldBe(13);
        facts.Contrasts.ShouldBeEmpty();

        var successor = facts.ChairConduct.Single(i => i.Code == "CHAIR_SYLLABUS_UPFRONT_V2");
        successor.Total.ShouldBe(6);
        successor.PreviousSeries.ShouldNotBeNull();
        successor.PreviousSeries!.Code.ShouldBe("CHAIR_SYLLABUS_UPFRONT");
        successor.PreviousSeries.Total.ShouldBe(7);
        successor.PreviousSeries.RetiredAt.ShouldNotBeNull();
    }

    /// <summary>
    /// El par de co-cursada nuevo, de los dos lados del piso, distinto del de 211+111: si cualquiera
    /// de los dos estados desaparece, cae acá.
    /// </summary>
    [Fact]
    public async Task The_second_pair_lands_on_both_sides_of_the_floor()
    {
        var published = (await SubjectAsync(Subject102)).TakenWith.Single(p => p.SubjectId == Subject103);
        published.TogetherCount.ShouldBe(11);
        published.IsPublished.ShouldBeTrue();

        var short_ = (await SubjectAsync(Subject104)).TakenWith.Single(p => p.SubjectId == Subject113);
        short_.TogetherCount.ShouldBe(6);
        short_.IsPublished.ShouldBeFalse();
        short_.MissingToPublish.ShouldBe(4);
    }
}
