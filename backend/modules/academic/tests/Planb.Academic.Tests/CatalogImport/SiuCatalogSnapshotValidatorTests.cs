using Planb.Academic.Infrastructure.CatalogImport;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.CatalogImport;

public class SiuCatalogSnapshotValidatorTests
{
    [Fact]
    public void Validate_CompleteZeroCoverage_RejectsEmptyCountry()
    {
        var errors = SiuCatalogSnapshotValidator.Validate(Snapshot());

        errors.ShouldContain("The national catalog cannot be empty.");
    }

    [Fact]
    public void Validate_RepeatedCoveragePair_RejectsSnapshotBeforeAnyWrite()
    {
        var snapshot = Snapshot() with { Coverage = [.. Snapshot().Coverage, Snapshot().Coverage[0]] };

        var errors = SiuCatalogSnapshotValidator.Validate(snapshot);

        errors.ShouldNotBeEmpty();
    }

    [Fact]
    public void GetDeterministicCareerId_SameOffering_ReturnsStableId()
    {
        var offering = new SiuCatalogOffering("B", "Buenos Aires", "undergraduate", "Universidad Ejemplo",
            "Facultad", "Carrera", "Grado", "4", null, "Calle 1 - Ciudad - Buenos Aires", null, null, null);

        SiuCatalogImporter.GetDeterministicCareerId(offering).ShouldBe(SiuCatalogImporter.GetDeterministicCareerId(offering));
    }

    private static SiuCatalogSnapshot Snapshot()
    {
        string[] provinces = ["B", "K", "H", "U", "C", "X", "W", "E", "P", "Y", "L", "F", "M", "N", "Q", "R", "A", "J", "D", "Z", "S", "G", "V", "T"];
        var coverage = provinces.SelectMany(code => new[] { "undergraduate", "postgraduate" }
            .Select(level => new SiuCatalogCoverage(code, level,
                $"https://guiadecarreras.siu.edu.ar/ciie_ofertas/2.0/guia_{(level == "undergraduate" ? "grado" : "postgrado")}.php?provincia={code}&nivel={(level == "undergraduate" ? "1" : "2")}", new string('a', 64), 0))).ToList();
        return new SiuCatalogSnapshot(1, "https://guiadecarreras.siu.edu.ar", DateTimeOffset.UtcNow, coverage, []);
    }
}
