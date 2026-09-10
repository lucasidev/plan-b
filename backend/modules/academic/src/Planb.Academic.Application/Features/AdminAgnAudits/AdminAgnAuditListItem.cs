namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Una fila por institución del catálogo, consultada o no (issue #506). <see cref="Checked"/> en
/// false significa que nunca se importó nada para esta institución: los demás campos vienen null,
/// distinto de un <see cref="Status"/> "NotPublished" (sí se consultó, no tiene informes).
/// </summary>
public sealed record AdminAgnAuditListItem(
    Guid UniversityId,
    string UniversityName,
    bool Checked,
    string? Status,
    string? Value,
    string? Period,
    string? SourceUrl,
    DateTimeOffset? LastCheckedAt);
