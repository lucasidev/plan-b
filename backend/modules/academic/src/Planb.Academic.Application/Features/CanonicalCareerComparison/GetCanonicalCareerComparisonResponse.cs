using Planb.Academic.Application.Features.OfficialFacts;

namespace Planb.Academic.Application.Features.CanonicalCareerComparison;

/// <summary>La comparación de una carrera canónica en las instituciones de una ciudad (SC-008, US-128, ADR-0090).</summary>
public sealed record GetCanonicalCareerComparisonResponse(
    string? GroupName,
    string CityLabel,
    bool IsProvinceFallback,
    IReadOnlyList<CareerComparisonOfferingResponse> Offerings);

/// <summary>
/// Una tarjeta de la comparación: identidad de la oferta y sus datos oficiales, con la misma forma
/// que el bloque de la ficha de carrera (<see cref="OfficialFactResponseItem"/>): es el mismo
/// componente del frontend el que los dibuja acá y allá, campo por campo.
/// </summary>
public sealed record CareerComparisonOfferingResponse(
    Guid CareerId,
    string CareerName,
    Guid UniversityId,
    string UniversityName,
    string? AcademicUnitName,
    string? InstitutionKind,
    IReadOnlyList<OfficialFactResponseItem> Facts);
