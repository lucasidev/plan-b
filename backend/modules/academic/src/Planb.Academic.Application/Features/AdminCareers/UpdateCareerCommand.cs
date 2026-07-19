using Planb.Academic.Domain;
using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Edición de una carrera del catálogo (US-061, admin). Replace del form completo: name, slug,
/// shortName, code y los atributos académicos se re-validan y re-normalizan como en el alta.
/// DegreeType y Modality llegan ya parseados a enum: el endpoint hace el <c>Enum.TryParse</c>
/// desde el string del body.
/// </summary>
public sealed record UpdateCareerCommand(
    Guid CareerId,
    string Name,
    string Slug,
    string? ShortName,
    string? Code,
    CareerDegreeType? DegreeType,
    int? DurationYears,
    TermKind? Modality,
    string? Description);
