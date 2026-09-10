using Planb.Academic.Application.Features.AdminUniversities;
using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Combina el catálogo completo de universidades con las afirmaciones <c>agn_audit</c> existentes
/// (issue #506): una fila por institución, consultada o no. Cuándo una institución acumuló más de
/// un import, la vigente la elige <see cref="OfficialFactCurrency.SelectCurrent{T}"/>, el mismo
/// criterio que usan las fichas, no un <c>ORDER BY</c> propio.
/// </summary>
public static class AdminAgnAuditResponseMapper
{
    public static IReadOnlyList<AdminAgnAuditListItem> Combine(
        IReadOnlyList<AdminUniversityListItem> universities,
        IReadOnlyList<AdminAgnAuditFactRow> facts)
    {
        var currentByUniversity = facts
            .GroupBy(f => f.UniversityId)
            .ToDictionary(g => g.Key, g => OfficialFactCurrency.SelectCurrent(g.ToList()));

        return universities
            .Select(u => currentByUniversity.TryGetValue(u.Id, out var current)
                ? new AdminAgnAuditListItem(
                    u.Id, u.Name, Checked: true, current.Status, current.Value, current.Period,
                    current.SourceUrl, current.SourceRetrievedAt)
                : new AdminAgnAuditListItem(
                    u.Id, u.Name, Checked: false, Status: null, Value: null, Period: null,
                    SourceUrl: null, LastCheckedAt: null))
            .OrderBy(i => i.UniversityName, StringComparer.Ordinal)
            .ToList();
    }
}
