using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.AdminUniversities;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de universidades (US-060). A diferencia del catálogo
/// público (<c>IAcademicQueryService.ListUniversitiesAsync</c>), trae activas e inactivas más el
/// count de careers por universidad (barato: LEFT JOIN + COUNT sobre un catálogo de pocas filas).
/// </summary>
internal sealed class DapperAdminUniversityReader : IAdminUniversityReader
{
    private readonly string _connectionString;

    public DapperAdminUniversityReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAdminUniversityReader.");
    }

    public async Task<IReadOnlyList<AdminUniversityListItem>> ListAsync(CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                u.id                          AS Id,
                u.name                        AS Name,
                u.slug                        AS Slug,
                u.institutional_email_domains AS InstitutionalEmailDomains,
                u.is_active                   AS IsActive,
                COUNT(c.id)                   AS CareerCount
            FROM academic.universities u
            LEFT JOIN academic.careers c ON c.university_id = u.id
            GROUP BY u.id, u.name, u.slug, u.institutional_email_domains, u.is_active
            ORDER BY u.name ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<AdminUniversityListItem>(
            new CommandDefinition(sql, cancellationToken: ct));
        return rows.ToList();
    }
}
