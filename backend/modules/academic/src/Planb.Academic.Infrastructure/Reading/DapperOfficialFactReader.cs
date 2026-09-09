using Dapper;
using Planb.Academic.Application.Features.OfficialFacts;
using Planb.Academic.Domain.OfficialFacts;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del read de <see cref="OfficialFact"/> por sujeto (ADR-0090). Trae TODAS
/// las afirmaciones del sujeto, sin elegir la vigente: ese criterio corre en el dominio
/// (<see cref="OfficialFactCurrency"/>), no acá. El filtro usa el índice
/// <c>ix_official_facts_subject_field</c> (subject_type, subject_id, field).
/// </summary>
internal sealed class DapperOfficialFactReader : IOfficialFactReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperOfficialFactReader(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<OfficialFactListItem>> ListBySubjectAsync(
        OfficialFactSubjectType subjectType, Guid subjectId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                id                  AS Id,
                field               AS Field,
                value               AS Value,
                unit                AS Unit,
                period              AS Period,
                source_name         AS SourceName,
                source_url          AS SourceUrl,
                source_document     AS SourceDocument,
                source_retrieved_at AS SourceRetrievedAt,
                status              AS Status,
                derivation_rule_id  AS DerivationRuleId,
                note                AS Note,
                relieved_at         AS RelievedAt,
                created_at          AS CreatedAt
            FROM academic.official_facts
            WHERE subject_type = @SubjectType AND subject_id = @SubjectId
            ORDER BY field ASC, relieved_at DESC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<OfficialFactListItem>(
            new CommandDefinition(
                sql,
                new { SubjectType = subjectType.ToString(), SubjectId = subjectId },
                cancellationToken: ct));
        return rows.ToList();
    }
}
