using Planb.Academic.Domain;
using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Alta de una carrera oficial del catálogo, anclada a una universidad (US-061, admin). El
/// aggregate normaliza slug/shortName/code (trim; el slug además a lowercase). DegreeType y
/// Modality llegan ya parseados a enum: el endpoint hace el <c>Enum.TryParse</c> desde el string
/// del body.
/// </summary>
public sealed record CreateCareerCommand(
    Guid UniversityId,
    string Name,
    string Slug,
    string? ShortName,
    string? Code,
    CareerDegreeType? DegreeType,
    int? DurationYears,
    TermKind? Modality,
    string? Description);
