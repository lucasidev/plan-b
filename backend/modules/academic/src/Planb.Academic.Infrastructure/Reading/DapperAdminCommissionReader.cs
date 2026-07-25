using System.Data;
using System.Globalization;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.AdminCommissions;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de comisiones de una materia+término (US-093). A
/// diferencia del catálogo público, trae comisiones activas e inactivas junto con el horario
/// completo. Docentes y horario son dos tablas hijas independientes entre sí: joinearlas ambas en una
/// sola query produciría un cross product (fan-out multiplicativo, una fila por cada combinación
/// docente x franja). Se resuelven con dos queries planas propias, aplicando el mismo criterio de
/// "flatten + agrupar en memoria" que <c>DapperAcademicQueryService.ListCommissionsBySubjectAndTermAsync</c>
/// usa para una sola tabla hija, y se combinan por commission_id.
/// </summary>
internal sealed class DapperAdminCommissionReader : IAdminCommissionReader
{
    private static readonly IReadOnlyList<AdminCommissionScheduleItem> EmptySchedule = [];

    private readonly string _connectionString;

    public DapperAdminCommissionReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperAdminCommissionReader.");
    }

    public async Task<IReadOnlyList<AdminCommissionListItem>> ListBySubjectAndTermAsync(
        Guid subjectId, Guid termId, CancellationToken ct = default)
    {
        const string teachersSql = @"
            SELECT
                c.id                  AS CommissionId,
                c.name                AS CommissionName,
                c.modality            AS Modality,
                c.capacity            AS Capacity,
                c.notes               AS Notes,
                c.is_active           AS IsActive,
                ct.teacher_id         AS TeacherId,
                initcap(t.first_name) AS FirstName,
                initcap(t.last_name)  AS LastName,
                ct.role               AS Role
            FROM academic.commissions c
            LEFT JOIN academic.commission_teachers ct ON ct.commission_id = c.id
            LEFT JOIN academic.teachers t ON t.id = ct.teacher_id
            WHERE c.subject_id = @SubjectId AND c.term_id = @TermId
            ORDER BY
                c.name,
                CASE ct.role
                    WHEN 'Lead'          THEN 0
                    WHEN 'Associate'     THEN 1
                    WHEN 'PracticalLead' THEN 2
                    WHEN 'Assistant'     THEN 3
                    WHEN 'Guest'         THEN 4
                    ELSE 5
                END;";

        const string scheduleSql = @"
            SELECT
                cs.commission_id AS CommissionId,
                cs.day_of_week   AS Day,
                cs.start_time    AS Start,
                cs.end_time      AS End
            FROM academic.commissions c
            JOIN academic.commission_schedules cs ON cs.commission_id = c.id
            WHERE c.subject_id = @SubjectId AND c.term_id = @TermId
            ORDER BY
                CASE cs.day_of_week
                    WHEN 'Monday'    THEN 1
                    WHEN 'Tuesday'   THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday'  THEN 4
                    WHEN 'Friday'    THEN 5
                    WHEN 'Saturday'  THEN 6
                    WHEN 'Sunday'    THEN 7
                    ELSE 8
                END,
                cs.start_time;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);

        var teacherRows = await db.QueryAsync<CommissionTeacherRow>(
            new CommandDefinition(
                teachersSql, new { SubjectId = subjectId, TermId = termId }, cancellationToken: ct));

        var scheduleRows = await db.QueryAsync<CommissionScheduleRow>(
            new CommandDefinition(
                scheduleSql, new { SubjectId = subjectId, TermId = termId }, cancellationToken: ct));

        var scheduleByCommission = scheduleRows
            .GroupBy(r => r.CommissionId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<AdminCommissionScheduleItem>)g
                    .Select(r => new AdminCommissionScheduleItem(
                        r.Day,
                        r.Start.ToString("HH:mm", CultureInfo.InvariantCulture),
                        r.End.ToString("HH:mm", CultureInfo.InvariantCulture)))
                    .ToList());

        // GroupBy preserva el orden de primera aparición de cada comisión (ya vienen ordenadas por
        // nombre desde el SQL), así que el listado sale ordenado sin re-sort.
        return teacherRows
            .GroupBy(r => (r.CommissionId, r.CommissionName, r.Modality, r.Capacity, r.Notes, r.IsActive))
            .Select(g => new AdminCommissionListItem(
                g.Key.CommissionId,
                g.Key.CommissionName,
                g.Key.Modality,
                g.Key.Capacity,
                g.Key.Notes,
                g.Key.IsActive,
                g.Where(r => r.TeacherId.HasValue)
                    .Select(r => new AdminCommissionTeacherItem(
                        r.TeacherId!.Value, r.FirstName!, r.LastName!, r.Role!))
                    .ToList(),
                scheduleByCommission.GetValueOrDefault(g.Key.CommissionId, EmptySchedule)))
            .ToList();
    }

    private sealed record CommissionTeacherRow(
        Guid CommissionId,
        string CommissionName,
        string Modality,
        int? Capacity,
        string? Notes,
        bool IsActive,
        Guid? TeacherId,
        string? FirstName,
        string? LastName,
        string? Role);

    private sealed record CommissionScheduleRow(Guid CommissionId, string Day, TimeOnly Start, TimeOnly End);
}
