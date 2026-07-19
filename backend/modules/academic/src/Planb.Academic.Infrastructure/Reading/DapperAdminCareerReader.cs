using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.AdminCareers;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de carreras de una universidad (US-061). A diferencia
/// del catálogo público (<c>IAcademicQueryService.ListCareersByUniversityAsync</c>), trae activas
/// e inactivas más el count de planes por carrera (barato: subquery sobre un catálogo de pocas
/// filas).
/// </summary>
internal sealed class DapperAdminCareerReader : IAdminCareerReader
{
    private readonly string _connectionString;

    public DapperAdminCareerReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAdminCareerReader.");
    }

    public async Task<IReadOnlyList<AdminCareerListItem>> ListByUniversityAsync(
        UniversityId universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                c.id          AS Id,
                c.name        AS Name,
                c.slug        AS Slug,
                c.short_name  AS ShortName,
                c.code        AS Code,
                c.is_official AS IsOfficial,
                c.is_active   AS IsActive,
                (SELECT COUNT(*)
                    FROM academic.career_plans cp
                    WHERE cp.career_id = c.id)     AS PlanCount
            FROM academic.careers c
            WHERE c.university_id = @UniversityId
            ORDER BY c.name ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<AdminCareerListItem>(
            new CommandDefinition(
                sql, new { UniversityId = universityId.Value }, cancellationToken: ct));
        return rows.ToList();
    }
}
