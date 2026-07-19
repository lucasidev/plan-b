namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Alta de una carrera oficial del catálogo, anclada a una universidad (US-061, admin). El
/// aggregate normaliza slug/shortName/code (trim; el slug además a lowercase).
/// </summary>
public sealed record CreateCareerCommand(
    Guid UniversityId,
    string Name,
    string Slug,
    string? ShortName,
    string? Code);
