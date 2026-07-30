using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Enrollments.Application.Features.GetMyTranscript;

namespace Planb.Enrollments.Infrastructure.Reading;

/// <summary>
/// Dapper read-side de GET /api/me/enrollment-records. Vive en Infrastructure porque el SQL cruza
/// dos schemas (enrollments, academic): enrollment_records se joinea con subjects (código/nombre),
/// academic_terms (label/year/number del período) y, cuando hay comisión, con commission_teachers +
/// teachers para el apellido del titular. ADR-0017 prohíbe FKs y EF nav cross-schema pero deja lugar
/// para joins Dapper crudos en el read path (ADR-0018).
///
/// <para>
/// El docente sale de <c>commission_teachers</c> filtrado a <c>role = 'Lead'</c>: la cursada misma
/// no guarda quién dio la clase, solo (opcionalmente) la comisión. Una comisión tiene a lo sumo un
/// Lead (invariante del aggregate <c>Commission</c>), así que el join no duplica filas. Sin
/// comisión, o con una comisión sembrada sin titular cargado, el LEFT JOIN no matchea y el apellido
/// viaja null: no hay dato real que inventar ahí.
/// </para>
///
/// <para>
/// Una sola query trae todas las cursadas del student ya en el orden final (año/número de período
/// descendente, con las cursadas sin período -equivalencias u otro caso con term_id null- al final
/// por los <c>NULLS LAST</c>); el agrupado por período y el promedio se arman acá en memoria.
/// Postgres no tiene forma barata de devolver "filas agrupadas como array de objetos" sin
/// jsonb_agg, y el volumen (el historial de un alumno) no lo justifica.
/// </para>
/// </summary>
internal sealed class DapperMyTranscriptReader : IMyTranscriptReader
{
    private readonly string _connectionString;

    public DapperMyTranscriptReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperMyTranscriptReader.");
    }

    public async Task<IReadOnlyList<TranscriptPeriod>> GetForStudentAsync(
        Guid studentProfileId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                er.term_id          AS TermId,
                t.label              AS TermLabel,
                t.year               AS TermYear,
                t.number             AS TermNumber,
                s.code               AS SubjectCode,
                s.name               AS SubjectName,
                er.status            AS Status,
                er.approval_method   AS ApprovalMethod,
                er.grade             AS Grade,
                lt.last_name         AS TeacherLastName
            FROM enrollments.enrollment_records er
            JOIN academic.subjects s
              ON s.id = er.subject_id
            LEFT JOIN academic.academic_terms t
              ON t.id = er.term_id
            LEFT JOIN academic.commission_teachers ct
              ON ct.commission_id = er.commission_id
             AND ct.role = 'Lead'
            LEFT JOIN academic.teachers lt
              ON lt.id = ct.teacher_id
            WHERE er.student_profile_id = @StudentProfileId
            ORDER BY t.year DESC NULLS LAST, t.number DESC NULLS LAST, s.code ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<Row>(
            new CommandDefinition(sql, new { StudentProfileId = studentProfileId }, cancellationToken: ct));

        // GroupBy preserva el orden de primera aparición de cada key (LINQ-to-Objects), y el SQL ya
        // entrega las filas en el orden final (año/número desc, período nulo al final), así que el
        // agrupado no necesita reordenar nada después.
        return rows
            .GroupBy(r => r.TermId)
            .Select(ToPeriod)
            .ToList();
    }

    private static TranscriptPeriod ToPeriod(IGrouping<Guid?, Row> group)
    {
        var first = group.First();
        var grades = group
            .Where(r => r.Grade is not null)
            .Select(r => r.Grade!.Value)
            .ToList();

        // Sin ninguna nota en el grupo, el promedio es null (nunca 0): ADR-0054, una métrica sin
        // sustento viaja null.
        decimal? average = grades.Count == 0 ? null : Math.Round(grades.Average(), 2);

        var items = group
            .Select(r => new TranscriptEntry(
                r.SubjectCode, r.SubjectName, r.Status, r.ApprovalMethod, r.Grade, r.TeacherLastName))
            .ToList();

        return new TranscriptPeriod(first.TermLabel, first.TermYear, first.TermNumber, average, items);
    }

    private sealed record Row(
        Guid? TermId,
        string? TermLabel,
        int? TermYear,
        int? TermNumber,
        string SubjectCode,
        string SubjectName,
        string Status,
        string? ApprovalMethod,
        decimal? Grade,
        string? TeacherLastName);
}
