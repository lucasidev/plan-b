namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Read-side de las afirmaciones <c>agn_audit</c> existentes (issue #506), con el nombre de la
/// institución. Trae TODAS las afirmaciones, sin elegir la vigente por institución: esa decisión la
/// toma <see cref="AdminAgnAuditResponseMapper"/> sobre lo que este reader trae, igual que
/// <c>IOfficialFactReader</c> para las fichas.
/// </summary>
public interface IAdminAgnAuditReader
{
    Task<IReadOnlyList<AdminAgnAuditFactRow>> ListFactsAsync(CancellationToken ct = default);
}
