using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.AdminAcademicTerms;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de períodos lectivos de una universidad (US-064).
/// </summary>
internal sealed class DapperAdminAcademicTermReader : IAdminAcademicTermReader
{
    private readonly string _connectionString;

    public DapperAdminAcademicTermReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAdminAcademicTermReader.");
    }

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

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<AdminAcademicTermListItem>(
            new CommandDefinition(
                sql, new { UniversityId = universityId.Value }, cancellationToken: ct));
        return rows.ToList();
    }
}
