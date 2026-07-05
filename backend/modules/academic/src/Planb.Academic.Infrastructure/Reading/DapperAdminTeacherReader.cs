using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.AdminTeachers;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de docentes (US-063). Trae activos e inactivos (a
/// diferencia del read público del catálogo). Nombres en title case (initcap) para display; el
/// storage es lowercase normalizado.
/// </summary>
internal sealed class DapperAdminTeacherReader : IAdminTeacherReader
{
    private readonly string _connectionString;

    public DapperAdminTeacherReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAdminTeacherReader.");
    }

    public async Task<IReadOnlyList<AdminTeacherListItem>> ListAsync(
        Guid? universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                t.id                  AS Id,
                t.university_id       AS UniversityId,
                u.name                AS UniversityName,
                initcap(t.first_name) AS FirstName,
                initcap(t.last_name)  AS LastName,
                t.title               AS Title,
                t.is_active           AS IsActive,
                t.created_at          AS CreatedAt
            FROM academic.teachers t
            JOIN academic.universities u ON u.id = t.university_id
            WHERE (@UniversityId IS NULL OR t.university_id = @UniversityId)
            ORDER BY t.last_name, t.first_name;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<AdminTeacherListItem>(
            new CommandDefinition(sql, new { UniversityId = universityId }, cancellationToken: ct));
        return rows.ToList();
    }
}
