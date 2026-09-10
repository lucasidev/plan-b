using Dapper;
using Planb.Academic.Application.Features.AdminAgnAudits;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del read de afirmaciones <c>agn_audit</c> con el nombre de su institución
/// (issue #506). INNER JOIN a propósito: solo trae instituciones que tienen al menos una fila, la
/// institución nunca consultada la completa <see cref="AdminAgnAuditResponseMapper"/> contra el
/// catálogo entero, no acá.
/// </summary>
internal sealed class DapperAdminAgnAuditReader : IAdminAgnAuditReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperAdminAgnAuditReader(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<AdminAgnAuditFactRow>> ListFactsAsync(CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                u.id                   AS UniversityId,
                u.name                 AS UniversityName,
                f.status                AS Status,
                f.value                 AS Value,
                f.period                AS Period,
                f.source_url            AS SourceUrl,
                f.source_retrieved_at   AS SourceRetrievedAt,
                f.relieved_at           AS RelievedAt,
                f.created_at            AS CreatedAt
            FROM academic.official_facts f
            JOIN academic.universities u ON u.id = f.subject_id
            WHERE f.subject_type = 'Institution' AND f.field = 'agn_audit';";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<AdminAgnAuditFactRow>(
            new CommandDefinition(sql, cancellationToken: ct));
        return rows.ToList();
    }
}
