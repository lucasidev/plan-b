using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Infrastructure.Seeding;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración de Dónde estudiarla (SC-008, US-128, ADR-0090, R6 tarea 5): el grupo
/// canónico "Tecnicatura o técnico en programación" (UNSTA, UNT y UTN-FRT, sembrado por
/// <see cref="AcademicSeeder"/>) contra <c>GET /api/academic/career-comparison</c>.
/// </summary>
public class CanonicalCareerComparisonEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly CanonicalCareerGroupings.Group ProgrammingGroup =
        CanonicalCareerGroupings.All.Single(g => g.Name == "Tecnicatura o técnico en programación");

    // El primer id del grupo es la Tecnicatura de UNSTA (CanonicalCareerGroupings.cs lo declara en
    // ese orden). No se busca por índice en AcademicSeedData.Careers: ese array se reordena cuando
    // el catálogo crece (ya rompió el índice fijo que usaban los tests de Identity) y este test no
    // depende de esa posición.
    private static Guid TudcsUnstaId => ProgrammingGroup.CareerIds[0].Value;

    private readonly RegisterApiFixture _fixture;

    public CanonicalCareerComparisonEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Reading_the_comparison_does_not_need_a_session()
    {
        using var anon = _fixture.Factory.CreateClient();
        var careerId = ProgrammingGroup.CareerIds[0].Value;

        var read = await anon.GetAsync($"/api/academic/career-comparison?careerId={careerId}");

        read.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Missing_career_id_is_400()
    {
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetAsync("/api/academic/career-comparison");

        read.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Unknown_career_id_is_404()
    {
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetAsync($"/api/academic/career-comparison?careerId={Guid.NewGuid()}");

        read.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task The_tudcs_group_names_every_institution_and_none_repeats()
    {
        // Tarea 5, listo cuando: la Tecnicatura de UNSTA se compara con las ofertas de UNT y UTN
        // y la pantalla dice qué es cada una. Acá se verifica el contrato, no el copy.
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetFromJsonAsync<ComparisonDto>(
            $"/api/academic/career-comparison?careerId={TudcsUnstaId}");

        read.ShouldNotBeNull();
        read!.GroupName.ShouldBe("Tecnicatura o técnico en programación");
        var universityNames = read.Offerings.Select(o => o.UniversityName).ToList();
        universityNames.Distinct().Count().ShouldBe(universityNames.Count);
    }

    [Fact]
    public async Task Every_offering_carries_the_same_official_fact_fields()
    {
        // Contrato de la tarea: los mismos campos, con la misma forma, en todas las tarjetas.
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetFromJsonAsync<ComparisonDto>(
            $"/api/academic/career-comparison?careerId={TudcsUnstaId}");

        read.ShouldNotBeNull();
        read!.Offerings.Count.ShouldBeGreaterThan(1);
        var fieldSets = read.Offerings.Select(o => o.Facts.Select(f => f.Field).OrderBy(f => f).ToList());
        fieldSets.Distinct(new SequenceEqualityComparer()).Count().ShouldBe(1);
    }

    private sealed record ComparisonDto(
        string? GroupName, string CityLabel, bool IsProvinceFallback, IReadOnlyList<OfferingDto> Offerings);

    private sealed record OfferingDto(
        Guid CareerId, string CareerName, Guid UniversityId, string UniversityName,
        string? AcademicUnitName, string? InstitutionKind, IReadOnlyList<FactDto> Facts);

    private sealed record FactDto(string Field, string Status);

    private sealed class SequenceEqualityComparer : IEqualityComparer<List<string>>
    {
        public bool Equals(List<string>? x, List<string>? y) => (x, y) switch
        {
            (null, null) => true,
            (null, _) or (_, null) => false,
            _ => x.SequenceEqual(y),
        };

        public int GetHashCode(List<string> obj) => obj.Aggregate(0, HashCode.Combine);
    }
}
