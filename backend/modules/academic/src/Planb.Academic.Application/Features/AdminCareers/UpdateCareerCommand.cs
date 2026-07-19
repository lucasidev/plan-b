namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Edición de una carrera del catálogo (US-061, admin). Replace del form completo: name, slug,
/// shortName y code se re-validan y re-normalizan como en el alta.
/// </summary>
public sealed record UpdateCareerCommand(
    Guid CareerId,
    string Name,
    string Slug,
    string? ShortName,
    string? Code);
