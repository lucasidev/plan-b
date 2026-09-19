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
/// El corpus de las cinco carreras nuevas de R7 produce exactamente los conteos que declara
/// <see cref="CorpusSeedData"/>: veinte cátedras con perfil propio, fama solo en una, el
/// contraste entre las dos hermanas de UNT y los dos pares de co-cursada nuevos.
///
/// <para>
/// No toca nada de la Tecnicatura de UNSTA: <see cref="CorpusSeedTests"/> sigue verde sin cambios,
/// y este archivo solo lee cátedras y materias de las cinco carreras que R7 agregó. Mismo criterio
/// de siembra manual que esa clase (el corpus va gateado por <c>PLANB_SEED_CORPUS</c> y los
/// integration tests corren sin esa variable).
/// </para>
/// </summary>
public class CorpusSeedNewCareersTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    // Cátedras que publican (AcademicSeedData.Chairs).
    private static readonly Guid ChairSosa = Guid.Parse("00000008-0000-4000-a000-000000000019");
    private static readonly Guid ChairMedina = Guid.Parse("00000008-0000-4000-a000-00000000001a");
    private static readonly Guid ChairRios = Guid.Parse("00000008-0000-4000-a000-00000000001b");
    private static readonly Guid ChairCastro = Guid.Parse("00000008-0000-4000-a000-00000000001c");
    private static readonly Guid ChairRojas = Guid.Parse("00000008-0000-4000-a000-00000000001d");
    private static readonly Guid ChairNavarro = Guid.Parse("00000008-0000-4000-a000-00000000001e");
    private static readonly Guid ChairQuiroga = Guid.Parse("00000008-0000-4000-a000-00000000001f");
    private static readonly Guid ChairVillalba = Guid.Parse("00000008-0000-4000-a000-000000000020");
    private static readonly Guid ChairFigueroa = Guid.Parse("00000008-0000-4000-a000-000000000021");
    private static readonly Guid ChairCarrizo = Guid.Parse("00000008-0000-4000-a000-000000000022");
    private static readonly Guid ChairGomez = Guid.Parse("00000008-0000-4000-a000-000000000023");
    private static readonly Guid ChairSalazar = Guid.Parse("00000008-0000-4000-a000-000000000025");
    private static readonly Guid ChairToledo = Guid.Parse("00000008-0000-4000-a000-000000000027");
    private static readonly Guid ChairGuzman = Guid.Parse("00000008-0000-4000-a000-000000000029");
    private static readonly Guid ChairDiaz = Guid.Parse("00000008-0000-4000-a000-00000000002b");

    // Cátedras que no llegan al piso.
    private static readonly Guid ChairMoyano = Guid.Parse("00000008-0000-4000-a000-000000000024");
    private static readonly Guid ChairPeralta = Guid.Parse("00000008-0000-4000-a000-000000000026");
    private static readonly Guid ChairEscobar = Guid.Parse("00000008-0000-4000-a000-000000000028");
    private static readonly Guid ChairTorres = Guid.Parse("00000008-0000-4000-a000-00000000002a");
    private static readonly Guid ChairNunez = Guid.Parse("00000008-0000-4000-a000-00000000002c");

    private static readonly Guid SubjectUntP06Programacion = Guid.Parse("00000004-0000-4000-a000-000000000106");
    private static readonly Guid SubjectIngInformaticaProgramacion1 = Guid.Parse("00000004-0000-4000-a000-000000000408");
    private static readonly Guid SubjectIngInformaticaMatematica1 = Guid.Parse("00000004-0000-4000-a000-000000000400");
    private static readonly Guid SubjectIngInformaticaProgramacion2 = Guid.Parse("00000004-0000-4000-a000-00000000040b");
    private static readonly Guid SubjectUnseMarcoJuridico = Guid.Parse("00000004-0000-4000-a000-000000000500");
    private static readonly Guid SubjectUnseGestionAdministrativa = Guid.Parse("00000004-0000-4000-a000-000000000502");

    public CorpusSeedNewCareersTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        await Planb.Api.Infrastructure.CorpusAccountsSeed.SeedAsync(scope.ServiceProvider);
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

    /// <summary>ChairId, reseñas, y cuántas de esas cursadas llegaron al final (aprobó + regular).</summary>
    public static IEnumerable<object[]> PublishingChairs() =>
        new (Guid ChairId, int ReviewCount, int Reaching)[]
        {
            (ChairSosa, 16, 12),
            (ChairMedina, 14, 6),
            (ChairRios, 13, 9),
            (ChairCastro, 15, 12),
            (ChairRojas, 12, 5),
            (ChairSalazar, 13, 10),
            (ChairNavarro, 12, 10),
            (ChairQuiroga, 11, 7),
            (ChairToledo, 10, 8),
            (ChairVillalba, 14, 9),
            (ChairFigueroa, 11, 8),
            (ChairGuzman, 12, 10),
            (ChairCarrizo, 18, 14),
            (ChairGomez, 12, 8),
            (ChairDiaz, 13, 10),
        }.Select(c => new object[] { c.ChairId, c.ReviewCount, c.Reaching });

    /// <summary>
    /// Cada cátedra que publica contesta el instrumento entero salvo CHAIR_SYLLABUS_UPFRONT (esa
    /// serie se corta en 122): sus seis frases de conducta y sus cuatro bloques de vivencia
    /// publicados, más la finalización agregada.
    /// </summary>
    [Theory]
    [MemberData(nameof(PublishingChairs))]
    public async Task Each_publishing_chair_answers_the_whole_instrument(
        Guid chairId, int reviewCount, int reaching)
    {
        var facts = await ChairAsync(chairId);

        facts.IsPublished.ShouldBeTrue();
        facts.ReviewCount.ShouldBe(reviewCount);
        facts.ReviewsMissingToPublish.ShouldBe(0);
        facts.ChairConduct.Count.ShouldBe(6);
        facts.StudentExperience.Count.ShouldBe(4);
        facts.Completion.ShouldNotBeNull();
        facts.Completion!.Reaching.ShouldBe(reaching);
        facts.Completion.Total.ShouldBe(reviewCount);
    }

    public static IEnumerable<object[]> ChairsBelowFloor() =>
        new (Guid ChairId, int ReviewCount)[]
        {
            (ChairMoyano, 7),
            (ChairPeralta, 8),
            (ChairEscobar, 6),
            (ChairTorres, 5),
            (ChairNunez, 9),
        }.Select(c => new object[] { c.ChairId, c.ReviewCount });

    /// <summary>Las que no llegan al piso se muestran igual, con cuánto juntan y cuánto les falta.</summary>
    [Theory]
    [MemberData(nameof(ChairsBelowFloor))]
    public async Task Each_chair_below_the_floor_says_how_many_it_is_missing(Guid chairId, int reviewCount)
    {
        var facts = await ChairAsync(chairId);

        facts.IsPublished.ShouldBeFalse();
        facts.ReviewCount.ShouldBe(reviewCount);
        facts.ReviewsMissingToPublish.ShouldBe(10 - reviewCount);
    }

    /// <summary>
    /// Rojas (perfil C con fama) converge en tres frases del lado malo: CHAIR_CLASSES_HELD,
    /// CHAIR_ANSWERS_OUTSIDE_CLASS y CHAIR_EXAM_DATE_NOTICE.
    /// </summary>
    [Fact]
    public async Task Only_rojas_has_fame_by_convergence()
    {
        var facts = await ChairAsync(ChairRojas);

        facts.Fame.ShouldNotBeNull();
        facts.Fame!.ItemsAgreeing.ShouldBeGreaterThanOrEqualTo(3);
        var codes = facts.Fame.Items.Select(i => i.Code).ToList();
        codes.ShouldContain("CHAIR_CLASSES_HELD");
        codes.ShouldContain("CHAIR_ANSWERS_OUTSIDE_CLASS");
        codes.ShouldContain("CHAIR_EXAM_DATE_NOTICE");
    }

    public static IEnumerable<object[]> ChairsWithoutFame() =>
        new[]
        {
            ChairSosa, ChairMedina, ChairRios, ChairCastro, ChairSalazar, ChairNavarro, ChairQuiroga,
            ChairToledo, ChairVillalba, ChairFigueroa, ChairGuzman, ChairCarrizo, ChairGomez, ChairDiaz,
        }.Select(id => new object[] { id });

    /// <summary>Ninguna otra cátedra de estas cinco carreras llega a tres frases convergentes.</summary>
    [Theory]
    [MemberData(nameof(ChairsWithoutFame))]
    public async Task No_other_chair_of_these_careers_has_fame(Guid chairId)
    {
        var facts = await ChairAsync(chairId);

        facts.Fame.ShouldBeNull();
    }

    /// <summary>
    /// Sosa y Medina son las dos hermanas de P06 Programación: los intervalos de Wilson de
    /// CHAIR_CLASSES_HELD no se tocan (Sosa casi no falta clases, Medina falta la mayoría), así que
    /// las dos publican el contraste, cada una con el número del otro lado.
    /// </summary>
    [Fact]
    public async Task Sosa_and_medina_contrast_on_classes_held()
    {
        var sosa = await ChairAsync(ChairSosa);
        var medina = await ChairAsync(ChairMedina);

        var sosaContrast = sosa.Contrasts.Single(c => c.ItemCode == "CHAIR_CLASSES_HELD");
        sosaContrast.HerePercent.ShouldBe(6);
        sosaContrast.HereTotal.ShouldBe(16);
        sosaContrast.SiblingsPercent.ShouldBe(64);
        sosaContrast.SiblingsTotal.ShouldBe(14);

        var medinaContrast = medina.Contrasts.Single(c => c.ItemCode == "CHAIR_CLASSES_HELD");
        medinaContrast.HerePercent.ShouldBe(64);
        medinaContrast.HereTotal.ShouldBe(14);
        medinaContrast.SiblingsPercent.ShouldBe(6);
        medinaContrast.SiblingsTotal.ShouldBe(16);
    }

    /// <summary>Los dos pares de co-cursada nuevos publican, con sus diez cuentas en común.</summary>
    [Fact]
    public async Task Both_new_pairs_publish_with_ten_accounts_in_common()
    {
        var programacion1 = await SubjectAsync(SubjectIngInformaticaProgramacion1);
        var pair1 = programacion1.TakenWith.Single(p => p.SubjectId == SubjectIngInformaticaMatematica1);
        pair1.TogetherCount.ShouldBe(10);
        pair1.IsPublished.ShouldBeTrue();

        var marcoJuridico = await SubjectAsync(SubjectUnseMarcoJuridico);
        var pair2 = marcoJuridico.TakenWith.Single(p => p.SubjectId == SubjectUnseGestionAdministrativa);
        pair2.TogetherCount.ShouldBe(10);
        pair2.IsPublished.ShouldBeTrue();
    }

    /// <summary>
    /// La frase de cátedra (headline) que la ficha de materia muestra por cada cátedra: el ítem de
    /// conducta con la moda más marcada, el mismo dato que ya publica la ficha propia de la
    /// cátedra (ADR-0083, US-129).
    /// </summary>
    [Fact]
    public async Task Chair_headlines_show_the_item_the_profile_makes_win()
    {
        var p06 = await SubjectAsync(SubjectUntP06Programacion);

        var sosaListing = p06.Chairs.Single(c => c.ChairId == ChairSosa);
        sosaListing.Headline.ShouldNotBeNull();
        sosaListing.Headline!.ItemCode.ShouldBe("CHAIR_ANSWERS_IN_CLASS");
        sosaListing.Headline.OptionValue.ShouldBe(1);

        var medinaListing = p06.Chairs.Single(c => c.ChairId == ChairMedina);
        medinaListing.Headline.ShouldNotBeNull();
        medinaListing.Headline!.ItemCode.ShouldBe("CHAIR_CLASSES_HELD");
        medinaListing.Headline.OptionValue.ShouldBe(3);

        var programacion2 = await SubjectAsync(SubjectIngInformaticaProgramacion2);
        var diazListing = programacion2.Chairs.Single(c => c.ChairId == ChairDiaz);
        diazListing.Headline.ShouldNotBeNull();
        diazListing.Headline!.ItemCode.ShouldBe("CHAIR_OFF_SYLLABUS_EXAMS");
        diazListing.Headline.OptionValue.ShouldBe(1);
    }
}
