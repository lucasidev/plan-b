using Planb.Academic.Domain.Careers;
using Planb.Academic.Infrastructure.CatalogImport;

namespace Planb.Academic.Infrastructure.Seeding;

/// <summary>Cuatro ofertas de Abogacía relevadas en SIU el 2026-09-17, mismo título y nivel.</summary>
public static class NationalCanonicalCareerGroupings
{
    public static IReadOnlyList<SiuCatalogOffering> LawOfferings { get; } =
    [
        Law("Universidad Champagnat", "Facultad de Derecho", "BELGRANO 721 - Godoy Cruz - Mendoza"),
        Law("Universidad de Congreso", "Facultad de Ciencias Jurídicas", "Colon 90 - Mendoza - Mendoza"),
        Law("Universidad del Aconcagua", "Facultad de Ciencias Económicas y Jurídicas", "Catamarca 147 - Mendoza - Mendoza"),
        Law("Universidad de Mendoza", "Facultad de Ciencias Jurídicas y Sociales", "Avenida Boulogne Sur Mer 683 - Mendoza - Mendoza"),
    ];

    public static IReadOnlyList<CareerId> LawCareerIds { get; } = LawOfferings
        .Select(o => new CareerId(SiuCatalogImporter.GetDeterministicCareerId(o))).ToArray();

    private static SiuCatalogOffering Law(string institution, string unit, string address) =>
        new("M", "Mendoza", "undergraduate", institution, unit, "Abogado", "Grado", null, null,
            address, null, null, null);
}
