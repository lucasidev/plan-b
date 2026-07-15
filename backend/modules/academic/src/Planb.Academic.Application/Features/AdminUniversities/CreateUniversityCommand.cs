namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Alta de una universidad del catálogo (US-060, admin). El aggregate normaliza slug + dominios
/// institucionales (lowercase, trim, dedup).
/// </summary>
public sealed record CreateUniversityCommand(
    string Name,
    string Slug,
    IReadOnlyList<string>? InstitutionalEmailDomains);
