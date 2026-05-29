using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Enrollments.Application.Contracts;

namespace Planb.Enrollments.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del read-side cross-BC de Enrollments. Vive en Infrastructure como
/// internal porque el caller siempre va por la interface registrada en DI. Hoy con un solo
/// método; cuando crezcan, se separan por tema manteniendo este sealed.
/// </summary>
internal sealed class DapperEnrollmentsQueryService : IEnrollmentsQueryService
{
    private readonly string _connectionString;

    public DapperEnrollmentsQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperEnrollmentsQueryService.");
    }

    public async Task<EnrollmentSummary?> GetEnrollmentByIdAsync(
        Guid enrollmentId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                e.id                  AS Id,
                e.student_profile_id  AS StudentProfileId,
                e.subject_id          AS SubjectId,
                e.commission_id       AS CommissionId,
                e.status              AS Status
            FROM enrollments.enrollment_records e
            WHERE e.id = @Id;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<EnrollmentSummary>(
            new CommandDefinition(sql, new { Id = enrollmentId }, cancellationToken: ct));
    }
}
