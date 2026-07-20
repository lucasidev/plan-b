using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.AdminSubjects;
using Planb.Academic.Domain.CareerPlans;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de materias de un plan de estudios (US-062). A
/// diferencia del catálogo público (<c>IAcademicQueryService.ListSubjectsByCareerPlanAsync</c>),
/// trae activas e inactivas más los campos de detalle (carga horaria, descripción).
/// </summary>
internal sealed class DapperAdminSubjectReader : IAdminSubjectReader
{
    private readonly string _connectionString;

    public DapperAdminSubjectReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAdminSubjectReader.");
    }

    public async Task<IReadOnlyList<AdminSubjectListItem>> ListByCareerPlanAsync(
        CareerPlanId careerPlanId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                s.id           AS Id,
                s.code         AS Code,
                s.name         AS Name,
                s.year_in_plan AS YearInPlan,
                s.term_in_year AS TermInYear,
                s.term_kind    AS TermKind,
                s.weekly_hours AS WeeklyHours,
                s.total_hours  AS TotalHours,
                s.description  AS Description,
                s.is_official  AS IsOfficial,
                s.is_active    AS IsActive
            FROM academic.subjects s
            WHERE s.career_plan_id = @CareerPlanId
            ORDER BY s.year_in_plan ASC, s.term_in_year ASC NULLS LAST, s.code ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<AdminSubjectListItem>(
            new CommandDefinition(
                sql, new { CareerPlanId = careerPlanId.Value }, cancellationToken: ct));
        return rows.ToList();
    }
}
