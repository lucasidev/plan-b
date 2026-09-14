using Planb.Academic.Infrastructure.Reading;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Reading;

/// <summary>
/// El mapeo de <see cref="DapperAcademicQueryService.ToCareerCatalogItem"/> (US-222, R6): la
/// carrera canónica es un lookup en memoria contra <c>CanonicalCareerGroupings</c>, sin columna ni
/// JOIN. Cubre solo esa resolución; la query en sí es integration (contrato de catalog-coverage).
/// </summary>
public class DapperAcademicQueryServiceTests
{
    [Fact]
    public void ToCareerCatalogItem_CareerBelongsToAGroup_ReturnsTheGroupName()
    {
        // UNSTA, Tecnicatura Universitaria en Desarrollo y Calidad de Software: primer id del
        // grupo "Tecnicatura o técnico en programación" (CanonicalCareerGroupings.cs).
        var careerId = Guid.Parse("00000002-0000-4000-a000-000000000003");
        var row = new DapperAcademicQueryService.CareerCatalogRow(
            careerId,
            "Tecnicatura Universitaria en Desarrollo y Calidad de Software",
            Guid.NewGuid(),
            "UNSTA",
            true);

        var item = DapperAcademicQueryService.ToCareerCatalogItem(row);

        item.CanonicalGroupName.ShouldBe("Tecnicatura o técnico en programación");
    }

    [Fact]
    public void ToCareerCatalogItem_CareerOutsideAnyGroup_ReturnsNull()
    {
        var row = new DapperAcademicQueryService.CareerCatalogRow(
            Guid.NewGuid(), "Procurador", Guid.NewGuid(), "UNSTA", true);

        var item = DapperAcademicQueryService.ToCareerCatalogItem(row);

        item.CanonicalGroupName.ShouldBeNull();
    }
}
