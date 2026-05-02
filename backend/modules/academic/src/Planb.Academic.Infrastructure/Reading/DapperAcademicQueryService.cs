using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del read-side cross-BC de Academic. Vive en Infrastructure como
/// internal porque ningun caller fuera de DI necesita instanciarlo (la interface está en
/// Contracts). Si la cantidad de queries crece más allá de unas pocas, se separan en archivos
/// por tema (ej. CareerPlanQueries, SubjectQueries) manteniendo cohesión.
/// </summary>
internal sealed class DapperAcademicQueryService : IAcademicQueryService
{
    private readonly string _connectionString;

    public DapperAcademicQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAcademicQueryService.");
    }

    public async Task<bool> CareerPlanExistsAsync(Guid careerPlanId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1
                FROM academic.career_plans
                WHERE id = @Id
            );";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = careerPlanId }, cancellationToken: ct));
    }

    public async Task<CareerPlanSummary?> GetCareerPlanByIdAsync(
        Guid careerPlanId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                cp.id          AS Id,
                cp.career_id   AS CareerId,
                c.university_id AS UniversityId,
                cp.year        AS Year
            FROM academic.career_plans cp
            JOIN academic.careers c ON c.id = cp.career_id
            WHERE cp.id = @Id;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<CareerPlanSummary>(
            new CommandDefinition(sql, new { Id = careerPlanId }, cancellationToken: ct));
    }
}
