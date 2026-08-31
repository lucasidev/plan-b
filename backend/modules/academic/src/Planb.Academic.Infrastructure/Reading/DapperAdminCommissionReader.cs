using System.Globalization;
using Dapper;
using Planb.Academic.Application.Features.AdminCommissions;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation de los listados admin de comisiones (US-093 y cont.): por materia+término, y
/// el global de un término cross-materia. A diferencia del catálogo público, ambos traen comisiones
/// activas e inactivas junto con el horario completo. Docentes y horario son dos tablas hijas
/// independientes entre sí: joinearlas ambas en una sola query produciría un cross product (fan-out
/// multiplicativo, una fila por cada combinación docente x franja). Se resuelven con dos queries
/// planas propias, aplicando el mismo criterio de "flatten + agrupar en memoria" que
/// <c>DapperAcademicQueryService.ListCommissionsBySubjectAndTermAsync</c> usa para una sola tabla
/// hija, y se combinan por commission_id.
/// </summary>
internal sealed class DapperAdminCommissionReader : IAdminCommissionReader
{
    private static readonly IReadOnlyList<AdminCommissionScheduleItem> EmptySchedule = [];

    private readonly IDbConnectionFactory _connections;

    public DapperAdminCommissionReader(IDbConnectionFactory connections) =>
        _connections = connections;

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
                c.schedules::text     AS SchedulesJson,
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

        using var db = _connections.Create();

        var teacherRows = await db.QueryAsync<CommissionTeacherRow>(
            new CommandDefinition(
                teachersSql, new { SubjectId = subjectId, TermId = termId }, cancellationToken: ct));

        // GroupBy preserva el orden de primera aparición de cada comisión (ya vienen ordenadas por
        // nombre desde el SQL), así que el listado sale ordenado sin re-sort.
        return teacherRows
            .GroupBy(r => (
                r.CommissionId, r.CommissionName, r.Modality, r.Capacity, r.Notes, r.IsActive,
                r.SchedulesJson))
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
                [.. CommissionScheduleJson.Read(g.Key.SchedulesJson)
                    .Select(s => new AdminCommissionScheduleItem(s.Day, s.Start, s.End))]))
            .ToList();
    }

    /// <summary>
    /// Listado global de comisiones de un término, cross-materia (US-093 cont.). Una sola query, con
    /// un JOIN a <c>academic.subjects</c> para traer código/nombre de materia (necesarios porque acá
    /// el listado mezcla materias distintas, no una sola). Las franjas viajan en la fila de la
    /// comisión, como documento embebido (ADR-0053).
    /// </summary>
    public async Task<IReadOnlyList<TermCommissionListItem>> ListByTermAsync(
        Guid termId, CancellationToken ct = default)
    {
        const string teachersSql = @"
            SELECT
                c.id                  AS CommissionId,
                c.subject_id          AS SubjectId,
                s.code                AS SubjectCode,
                s.name                AS SubjectName,
                c.name                AS CommissionName,
                c.modality            AS Modality,
                c.capacity            AS Capacity,
                c.is_active           AS IsActive,
                c.schedules::text     AS SchedulesJson,
                ct.teacher_id         AS TeacherId,
                initcap(t.first_name) AS FirstName,
                initcap(t.last_name)  AS LastName,
                ct.role               AS Role
            FROM academic.commissions c
            JOIN academic.subjects s ON s.id = c.subject_id
            LEFT JOIN academic.commission_teachers ct ON ct.commission_id = c.id
            LEFT JOIN academic.teachers t ON t.id = ct.teacher_id
            WHERE c.term_id = @TermId
            ORDER BY
                s.name,
                c.name,
                CASE ct.role
                    WHEN 'Lead'          THEN 0
                    WHEN 'Associate'     THEN 1
                    WHEN 'PracticalLead' THEN 2
                    WHEN 'Assistant'     THEN 3
                    WHEN 'Guest'         THEN 4
                    ELSE 5
                END;";

        using var db = _connections.Create();

        var teacherRows = await db.QueryAsync<TermCommissionTeacherRow>(
            new CommandDefinition(teachersSql, new { TermId = termId }, cancellationToken: ct));

        // GroupBy preserva el orden de primera aparición de cada comisión (ya vienen ordenadas por
        // materia+comisión desde el SQL), así que el listado sale ordenado sin re-sort.
        return teacherRows
            .GroupBy(r => (
                r.CommissionId, r.SubjectId, r.SubjectCode, r.SubjectName, r.CommissionName,
                r.Modality, r.Capacity, r.IsActive, r.SchedulesJson))
            .Select(g => new TermCommissionListItem(
                g.Key.CommissionId,
                g.Key.SubjectId,
                g.Key.SubjectCode,
                g.Key.SubjectName,
                g.Key.CommissionName,
                g.Key.Modality,
                g.Key.Capacity,
                g.Key.IsActive,
                g.Where(r => r.TeacherId.HasValue)
                    .Select(r => new AdminCommissionTeacherItem(
                        r.TeacherId!.Value, r.FirstName!, r.LastName!, r.Role!))
                    .ToList(),
                [.. CommissionScheduleJson.Read(g.Key.SchedulesJson)
                    .Select(s => new AdminCommissionScheduleItem(s.Day, s.Start, s.End))]))
            .ToList();
    }

    private sealed record CommissionTeacherRow(
        Guid CommissionId,
        string CommissionName,
        string Modality,
        int? Capacity,
        string? Notes,
        bool IsActive,
        string? SchedulesJson,
        Guid? TeacherId,
        string? FirstName,
        string? LastName,
        string? Role);

    private sealed record TermCommissionTeacherRow(
        Guid CommissionId,
        Guid SubjectId,
        string SubjectCode,
        string SubjectName,
        string CommissionName,
        string Modality,
        int? Capacity,
        bool IsActive,
        string? SchedulesJson,
        Guid? TeacherId,
        string? FirstName,
        string? LastName,
        string? Role);
}
