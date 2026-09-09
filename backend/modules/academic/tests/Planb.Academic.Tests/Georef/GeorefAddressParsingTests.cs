using Planb.Academic.Infrastructure.Georef;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Georef;

public class GeorefAddressParsingTests
{
    [Fact]
    public void ExtractLocality_ThreePartAddress_ReturnsMiddlePart()
    {
        var locality = GeorefAddressParsing.ExtractLocality("Av. Perón 2085 - Yerba Buena - Tucumán");

        locality.ShouldBe("Yerba Buena");
    }

    [Fact]
    public void ExtractLocality_HyphenGluedToStreetSegment_StillSplitsOnSpacedHyphen()
    {
        // Domicilio real de la Guía SIU (Facultad de Derecho y Ciencias Sociales Convenio Bella
        // Vista, UNT): el guion de "Marconi -Bella Vista" no tiene espacio de los dos lados, así
        // que " - " no lo toma como separador y las 3 partes salen bien.
        var locality = GeorefAddressParsing.ExtractLocality(
            "Sarmiento y Marconi -Bella Vista - Amaicha Del Llano - Tucumán");

        locality.ShouldBe("Amaicha Del Llano");
    }

    [Theory]
    [InlineData("Domicilio sin separador")]
    [InlineData("Una - Sola - Separacion - De - Mas")]
    public void ExtractLocality_NotThreeParts_ReturnsNull(string address)
    {
        var locality = GeorefAddressParsing.ExtractLocality(address);

        locality.ShouldBeNull();
    }

    [Fact]
    public void ExtractProvince_ThreePartAddress_ReturnsLastPart()
    {
        var province = GeorefAddressParsing.ExtractProvince("Av. Perón 2085 - Yerba Buena - Tucumán");

        province.ShouldBe("Tucumán");
    }

    [Theory]
    [InlineData("Domicilio sin separador")]
    [InlineData("Una - Sola - Separacion - De - Mas")]
    public void ExtractProvince_NotThreeParts_ReturnsNull(string address)
    {
        var province = GeorefAddressParsing.ExtractProvince(address);

        province.ShouldBeNull();
    }
}
