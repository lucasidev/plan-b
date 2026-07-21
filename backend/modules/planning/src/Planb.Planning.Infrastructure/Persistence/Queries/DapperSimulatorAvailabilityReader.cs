using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Features.GetAvailableSubjects;
using Planb.Planning.Domain.Availability;

namespace Planb.Planning.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read para US-016 (lado "available"). Cruza <c>academic.subjects</c>,
/// <c>academic.prerequisites</c> y <c>enrollments.enrollment_records</c> en SQL parametrizado, sin
/// referenciar el Domain de esos módulos (ADR-0017): mismo criterio que
/// <c>DapperBrowseReviewsQueryService</c> en Reviews, que también cruza schemas ajenos a pulso.
///
/// <para>
/// Tres queries paradas sobre la misma conexión (una por "cosa": materias, correlativas, progreso)
/// en vez de un solo join: las tres tienen shape y cardinalidad distintas (N materias, M
/// correlativas, K registros de progreso no relacionados 1:1 entre sí), así que un join único
/// produciría un producto cartesiano para proyectar después con Dapper multi-mapping, más
/// complicado que tres queries chicas y legibles.
/// </para>
/// </summary>
internal sealed class DapperSimulatorAvailabilityReader : ISimulatorAvailabilityReader
{
    private readonly string _connectionString;

    public DapperSimulatorAvailabilityReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperSimulatorAvailabilityReader.");
    }

    public async Task<SimulatorPlanSnapshot> GetPlanSnapshotAsync(
        Guid careerPlanId, Guid studentProfileId, CancellationToken ct = default)
    {
        using IDbConnection db = new NpgsqlConnection(_connectionString);

        var subjects = await GetActiveSubjectsAsync(db, careerPlanId, ct);
        var prerequisites = await GetPrerequisitesAsync(db, careerPlanId, ct);
        var progressBySubject = await GetProgressBySubjectAsync(db, careerPlanId, studentProfileId, ct);

        return new SimulatorPlanSnapshot(subjects, prerequisites, progressBySubject);
    }

    /// <summary>
    /// Materias activas del plan. Una materia archivada (is_active=false) no se ofrece para cursar
    /// (US-016 AC), así que ni siquiera entra al cómputo de disponibilidad.
    /// </summary>
    private static async Task<IReadOnlyList<SimulatorSubjectSnapshot>> GetActiveSubjectsAsync(
        IDbConnection db, Guid careerPlanId, CancellationToken ct)
    {
        const string sql = @"
            SELECT
                id             AS Id,
                code           AS Code,
                name           AS Name,
                year_in_plan   AS YearInPlan,
                term_in_year   AS TermInYear,
                term_kind      AS TermKind,
                weekly_hours   AS WeeklyHours,
                total_hours    AS TotalHours
            FROM academic.subjects
            WHERE career_plan_id = @CareerPlanId AND is_active = true
            ORDER BY year_in_plan ASC, term_in_year ASC NULLS LAST, code ASC;";

        var rows = await db.QueryAsync<SimulatorSubjectSnapshot>(
            new CommandDefinition(sql, new { CareerPlanId = careerPlanId }, cancellationToken: ct));
        return rows.AsList();
    }

    /// <summary>
    /// Correlativas del plan (los dos types juntos; el evaluador filtra ToEnroll). Resuelve el
    /// plan vía join con subjects, igual que <c>PrerequisiteRepository.GetByPlanAsync</c> en
    /// Academic: la tabla de correlativas no lleva career_plan_id propio.
    /// </summary>
    private static async Task<IReadOnlyList<PrerequisiteEdge>> GetPrerequisitesAsync(
        IDbConnection db, Guid careerPlanId, CancellationToken ct)
    {
        const string sql = @"
            SELECT
                p.subject_id          AS SubjectId,
                p.required_subject_id AS RequiredSubjectId,
                p.type                AS Type
            FROM academic.prerequisites p
            JOIN academic.subjects s ON s.id = p.subject_id
            WHERE s.career_plan_id = @CareerPlanId;";

        var rows = await db.QueryAsync<PrerequisiteEdgeRow>(
            new CommandDefinition(sql, new { CareerPlanId = careerPlanId }, cancellationToken: ct));

        return rows
            .Select(r => new PrerequisiteEdge(r.SubjectId, r.RequiredSubjectId, MapKind(r.Type)))
            .ToList();
    }

    /// <summary>
    /// Progreso del alumno por materia del plan. Un mismo (student, subject) puede tener más de un
    /// registro a lo largo del tiempo (recursada: ADR-0004 dice que el enrollment guarda hechos, no
    /// un estado único "vigente"), así que <c>DISTINCT ON</c> se queda con el más nuevo por
    /// <c>created_at</c>: es el último hecho que el alumno reportó sobre esa materia, y el que mejor
    /// refleja su situación actual (por ej. Cursando de nuevo este año le gana a un Regular viejo si
    /// la regularidad venció y está recursando).
    /// </summary>
    private static async Task<IReadOnlyDictionary<Guid, SubjectProgress>> GetProgressBySubjectAsync(
        IDbConnection db, Guid careerPlanId, Guid studentProfileId, CancellationToken ct)
    {
        const string sql = @"
            SELECT DISTINCT ON (er.subject_id)
                er.subject_id AS SubjectId,
                er.status     AS Status
            FROM enrollments.enrollment_records er
            JOIN academic.subjects s ON s.id = er.subject_id
            WHERE er.student_profile_id = @StudentProfileId
              AND s.career_plan_id = @CareerPlanId
            ORDER BY er.subject_id, er.created_at DESC;";

        var rows = await db.QueryAsync<SubjectProgressRow>(
            new CommandDefinition(
                sql,
                new { StudentProfileId = studentProfileId, CareerPlanId = careerPlanId },
                cancellationToken: ct));

        return rows.ToDictionary(r => r.SubjectId, r => MapProgress(r.Status));
    }

    /// <summary>
    /// Traduce el <c>type</c> varchar de <c>academic.prerequisites</c> a <see cref="PrerequisiteKind"/>.
    /// La tabla no tiene un CHECK que restrinja la columna a estos dos valores (solo el
    /// <c>HasConversion&lt;string&gt;()</c> de EF del lado de Academic los produce); un valor
    /// desconocido acá es un dato corrupto, no una falla de negocio esperable. Preferimos un crash
    /// ruidoso a devolver un default silencioso que arruine el cómputo de disponibilidad sin que
    /// nadie se entere.
    /// </summary>
    private static PrerequisiteKind MapKind(string type) => type switch
    {
        "ToEnroll" => PrerequisiteKind.ToEnroll,
        "ToTakeFinal" => PrerequisiteKind.ToTakeFinal,
        _ => throw new InvalidOperationException(
            $"Unknown prerequisite type '{type}' in academic.prerequisites. " +
            "Expected 'ToEnroll' or 'ToTakeFinal'."),
    };

    /// <summary>
    /// Traduce el <c>status</c> varchar de <c>enrollments.enrollment_records</c> a
    /// <see cref="SubjectProgress"/>. Mismo criterio que <see cref="MapKind"/>: un valor desconocido
    /// es un dato corrupto y truena en vez de mapear en silencio a <c>NotStarted</c> o similar.
    /// </summary>
    private static SubjectProgress MapProgress(string status) => status switch
    {
        "InProgress" => SubjectProgress.InProgress,
        "Regularized" => SubjectProgress.Regular,
        "Passed" => SubjectProgress.Approved,
        "Failed" => SubjectProgress.Failed,
        "Dropped" => SubjectProgress.Dropped,
        _ => throw new InvalidOperationException(
            $"Unknown enrollment status '{status}' in enrollments.enrollment_records. " +
            "Expected one of InProgress/Regularized/Passed/Failed/Dropped."),
    };

    private sealed record PrerequisiteEdgeRow
    {
        public Guid SubjectId { get; init; }
        public Guid RequiredSubjectId { get; init; }
        public string Type { get; init; } = string.Empty;
    }

    private sealed record SubjectProgressRow
    {
        public Guid SubjectId { get; init; }
        public string Status { get; init; } = string.Empty;
    }
}
