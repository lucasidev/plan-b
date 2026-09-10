namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>Wrapper del listado de auditorías AGN por institución (issue #506).</summary>
public sealed record GetAdminAgnAuditsResponse(IReadOnlyList<AdminAgnAuditListItem> Items);
