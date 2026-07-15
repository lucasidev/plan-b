namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Edición de una universidad del catálogo (US-060, admin). Replace del form completo: name, slug
/// y dominios institucionales se re-validan y re-normalizan como en el alta.
/// </summary>
public sealed record UpdateUniversityCommand(
    Guid UniversityId,
    string Name,
    string Slug,
    IReadOnlyList<string>? InstitutionalEmailDomains);
