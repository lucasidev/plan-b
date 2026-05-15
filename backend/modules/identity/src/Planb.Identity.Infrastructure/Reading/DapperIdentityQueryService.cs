using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Identity.Application.Contracts;

namespace Planb.Identity.Infrastructure.Reading;

/// <summary>
/// Impl Dapper del contract público <see cref="IIdentityQueryService"/>. Separada del read
/// service interno (<c>DapperIdentityReadService</c>) por dos razones:
///   1. Aislar la superficie cross-BC: si mañana cambia el shape interno
///      <c>StudentProfileResponse</c>, no rompe a Enrollments/Reviews/etc.
///   2. Filtrar columnas: el internal puede leakear cosas que el cross-BC no debe ver (ej.
///      enrollment_year detallado), acá se proyecta solo lo necesario.
/// </summary>
internal sealed class DapperIdentityQueryService : IIdentityQueryService
{
    private readonly string _connectionString;

    public DapperIdentityQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperIdentityQueryService.");
    }

    public async Task<StudentProfileSummary?> GetStudentProfileForUserAsync(
        Guid userId, CancellationToken ct = default)
    {
        // 1 row por user en el modelo MVP (UNIQUE(user_id, career_id) y handler enforce 1
        // active). Cuando el dominio soporte múltiples profiles activos, agregar filtro
        // explícito por status='active' acá y revisar caller.
        const string sql = @"
            SELECT
                id               AS Id,
                user_id          AS UserId,
                career_id        AS CareerId,
                career_plan_id   AS CareerPlanId,
                status = 'Active' AS IsActive
            FROM identity.student_profiles
            WHERE user_id = @UserId
            LIMIT 1;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<StudentProfileSummary>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }
}
