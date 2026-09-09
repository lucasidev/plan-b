using Planb.Academic.Domain.Careers;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Careers;

/// <summary>
/// Escenarios de US-128 y de la tarea 5 de R6 (Dónde estudiarla): agrupar por localidad, caer a
/// provincia sin fingir una ciudad, y no mezclar ciudades entre sí.
/// </summary>
public class CanonicalCareerComparisonPolicyTests
{
    private sealed record Offering(Guid CareerId, string? LocalityName, string Province) : ILocatedOffering;

    [Fact]
    public void GroupBySeedCity_SameResolvedLocality_GroupsTogether()
    {
        var unt = new Offering(Guid.NewGuid(), "San Miguel de Tucumán", "Tucumán");
        var utn = new Offering(Guid.NewGuid(), "San Miguel de Tucumán", "Tucumán");

        var result = CanonicalCareerComparisonPolicy.GroupBySeedCity(new[] { unt, utn }, unt.CareerId);

        result.CityLabel.ShouldBe("San Miguel de Tucumán");
        result.IsProvinceFallback.ShouldBeFalse();
        result.Offerings.ShouldBe(new[] { unt, utn });
    }

    [Fact]
    public void GroupBySeedCity_DifferentLocality_DoesNotMixSanMiguelWithConcepcion()
    {
        // "Las ofertas de San Miguel de Tucumán se comparan entre sí sin mezclarse con las de
        // Concepción" (US-128, cómo sé que está bien).
        var sanMiguel = new Offering(Guid.NewGuid(), "San Miguel de Tucumán", "Tucumán");
        var concepcion = new Offering(Guid.NewGuid(), "Concepción", "Tucumán");

        var result = CanonicalCareerComparisonPolicy.GroupBySeedCity(
            new[] { sanMiguel, concepcion }, sanMiguel.CareerId);

        result.Offerings.ShouldBe(new[] { sanMiguel });
        result.Offerings.ShouldNotContain(concepcion);
    }

    [Fact]
    public void GroupBySeedCity_SeedLocalityUnresolved_FallsBackToProvinceAndFlagsIt()
    {
        var seed = new Offering(Guid.NewGuid(), null, "Tucumán");
        var sameProvinceUnresolved = new Offering(Guid.NewGuid(), null, "Tucumán");

        var result = CanonicalCareerComparisonPolicy.GroupBySeedCity(
            new[] { seed, sameProvinceUnresolved }, seed.CareerId);

        result.CityLabel.ShouldBe("Tucumán");
        result.IsProvinceFallback.ShouldBeTrue();
        result.Offerings.Count.ShouldBe(2);
    }

    [Fact]
    public void GroupBySeedCity_UnresolvedSeedDoesNotMergeWithAResolvedCityInTheSameProvince()
    {
        // No finge una ciudad que no sabe: una localidad sin resolver no se junta con una
        // localidad sí resuelta solo porque las dos están en la misma provincia.
        var seed = new Offering(Guid.NewGuid(), null, "Tucumán");
        var resolved = new Offering(Guid.NewGuid(), "San Miguel de Tucumán", "Tucumán");

        var result = CanonicalCareerComparisonPolicy.GroupBySeedCity(new[] { seed, resolved }, seed.CareerId);

        result.Offerings.ShouldBe(new[] { seed });
    }

    [Fact]
    public void GroupBySeedCity_OnlyOneOfferingInTheCity_ReturnsJustTheSeed()
    {
        // "Solo una institución cargada: la pantalla dice 'no hay con qué comparar todavía'"
        // (SC-008): la policy no decide ese copy, pero tiene que dejar el dato (Count == 1) para
        // que el caller lo diga.
        var seed = new Offering(Guid.NewGuid(), "Yerba Buena", "Tucumán");

        var result = CanonicalCareerComparisonPolicy.GroupBySeedCity(new[] { seed }, seed.CareerId);

        result.Offerings.Count.ShouldBe(1);
    }

    [Fact]
    public void GroupBySeedCity_SeedNotInOfferings_Throws()
    {
        var offerings = new[] { new Offering(Guid.NewGuid(), "San Miguel de Tucumán", "Tucumán") };

        Should.Throw<ArgumentException>(() =>
            CanonicalCareerComparisonPolicy.GroupBySeedCity(offerings, Guid.NewGuid()));
    }
}
