using Dapper;
using Planb.Academic.Application.Features.AdminAcademicTerms;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de períodos lectivos de una universidad (US-064).
/// </summary>
internal sealed class DapperAdminAcademicTermReader : IAdminAcademicTermReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperAdminAcademicTermReader(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<AdminAcademicTermListItem>> ListByUniversityAsync(
        UniversityId universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                t.id         AS Id,
                t.year       AS Year,
                t.number     AS Number,
                t.kind       AS Kind,
                t.label      AS Label,
                t.start_date AS StartDate,
                t.end_date   AS EndDate
            FROM academic.academic_terms t
            WHERE t.university_id = @UniversityId
            ORDER BY t.year DESC, t.number DESC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<AdminAcademicTermListItem>(
            new CommandDefinition(
                sql, new { UniversityId = universityId.Value }, cancellationToken: ct));
        return rows.ToList();
    }
}
