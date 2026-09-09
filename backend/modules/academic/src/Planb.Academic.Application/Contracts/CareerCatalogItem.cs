namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Una carrera del catálogo entero, con su universidad ya resuelta. Caller: el catálogo de
/// Explorar (US-222, <see cref="IAcademicQueryService.ListAllCareersAsync"/>), que arma las dos
/// lentes (por carrera, por institución) desde una sola lista en vez de pedirla universidad por
/// universidad.
/// </summary>
public sealed record CareerCatalogItem(
    Guid Id,
    string Name,
    Guid UniversityId,
    string UniversityName,
    /// <summary>US-088: carreras cargadas por alumnos (crowdsourced) tienen IsOfficial=false.</summary>
    bool IsOfficial);
