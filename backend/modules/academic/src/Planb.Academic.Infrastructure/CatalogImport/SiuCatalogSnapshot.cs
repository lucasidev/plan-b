namespace Planb.Academic.Infrastructure.CatalogImport;

/// <summary>Snapshot cerrado de la Guía SIU, descargado antes de ejecutar el import.</summary>
public sealed record SiuCatalogSnapshot(
    int SchemaVersion,
    string SourceUrl,
    DateTimeOffset RetrievedAt,
    IReadOnlyList<SiuCatalogCoverage> Coverage,
    IReadOnlyList<SiuCatalogOffering> Offerings);

public sealed record SiuCatalogCoverage(
    string ProvinceCode,
    string Level,
    string Url,
    string Sha256,
    int Count);

public sealed record SiuCatalogOffering(
    string ProvinceCode,
    string Province,
    string Level,
    string Institution,
    string? AcademicUnit,
    string Title,
    string? DegreeType,
    string? Duration,
    string? Admission,
    string? Address,
    string? Telephone,
    string? Website,
    string? Email);

public sealed record CatalogImportResult(
    int UniversitiesCreated,
    int AcademicUnitsCreated,
    int CareersCreated,
    int OfficialFactsCreated,
    int TucumanOfferingsPreserved,
    IReadOnlyList<string> Pending);
