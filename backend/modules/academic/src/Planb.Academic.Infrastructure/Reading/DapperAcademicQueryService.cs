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

    public async Task<bool> UniversityExistsAsync(Guid universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1
                FROM academic.universities
                WHERE id = @Id
            );";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = universityId }, cancellationToken: ct));
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

    public async Task<IReadOnlyList<UniversityListItem>> ListUniversitiesAsync(
        CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                id   AS Id,
                name AS Name,
                slug AS Slug
            FROM academic.universities
            ORDER BY name ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<UniversityListItem>(
            new CommandDefinition(sql, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<CareerListItem>> ListCareersByUniversityAsync(
        Guid universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                id            AS Id,
                university_id AS UniversityId,
                name          AS Name,
                slug          AS Slug,
                is_official   AS IsOfficial
            FROM academic.careers
            WHERE university_id = @UniversityId
            ORDER BY is_official DESC, name ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<CareerListItem>(
            new CommandDefinition(sql, new { UniversityId = universityId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<CareerPlanListItem>> ListCareerPlansByCareerAsync(
        Guid careerId, CancellationToken ct = default)
    {
        // Ordenamos oficial primero, después por año descendente. La UX espera ver el plan
        // vigente arriba; entre planes del mismo año, prevalece el oficial sobre el crowdsourced
        // si conviven.
        const string sql = @"
            SELECT
                id          AS Id,
                career_id   AS CareerId,
                year        AS Year,
                status      AS Status,
                is_official AS IsOfficial
            FROM academic.career_plans
            WHERE career_id = @CareerId
            ORDER BY is_official DESC, year DESC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<CareerPlanListItem>(
            new CommandDefinition(sql, new { CareerId = careerId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<bool> IsSubjectInPlanAsync(
        Guid subjectId, Guid careerPlanId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1
                FROM academic.subjects
                WHERE id = @SubjectId
                  AND career_plan_id = @CareerPlanId
            );";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                sql,
                new { SubjectId = subjectId, CareerPlanId = careerPlanId },
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<SubjectListItem>> ListSubjectsByCareerPlanAsync(
        Guid careerPlanId, bool includeArchived = false, CancellationToken ct = default)
    {
        // US-062: por default se ocultan las materias archivadas (soft delete), que es lo que
        // necesita el catálogo público. El historial del alumno pide includeArchived=true: si
        // cursó una materia que después se archivó, tiene que poder cargarla igual.
        const string sql = @"
            SELECT
                id             AS Id,
                career_plan_id AS CareerPlanId,
                code           AS Code,
                name           AS Name,
                year_in_plan   AS YearInPlan,
                term_in_year   AS TermInYear,
                term_kind      AS TermKind
            FROM academic.subjects
            WHERE career_plan_id = @CareerPlanId AND (@IncludeArchived OR is_active)
            ORDER BY year_in_plan ASC, term_in_year ASC NULLS LAST, code ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<SubjectListItem>(
            new CommandDefinition(
                sql,
                new { CareerPlanId = careerPlanId, IncludeArchived = includeArchived },
                cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<SubjectDetailItem?> GetSubjectByIdAsync(
        Guid subjectId, CancellationToken ct = default)
    {
        // US-062: la página pública de materia no muestra materias archivadas (soft delete).
        const string sql = @"
            SELECT
                id             AS Id,
                career_plan_id AS CareerPlanId,
                code           AS Code,
                name           AS Name,
                year_in_plan   AS YearInPlan,
                term_in_year   AS TermInYear,
                term_kind      AS TermKind,
                weekly_hours   AS WeeklyHours,
                total_hours    AS TotalHours,
                description    AS Description,
                is_official    AS IsOfficial
            FROM academic.subjects
            WHERE id = @SubjectId AND is_active = true;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<SubjectDetailItem>(
            new CommandDefinition(sql, new { SubjectId = subjectId }, cancellationToken: ct));
    }

    public async Task<TeacherDetailItem?> GetTeacherByIdAsync(
        Guid teacherId, CancellationToken ct = default)
    {
        // initcap() capitaliza la primera letra de cada palabra (unicode-aware en Postgres:
        // "verónica ledesma" -> "Verónica Ledesma"). El storage queda en lowercase normalizado
        // para dedup/búsqueda; la capitalización es responsabilidad del read, no del dominio.
        const string sql = @"
            SELECT
                id                 AS Id,
                university_id       AS UniversityId,
                initcap(first_name) AS FirstName,
                initcap(last_name)  AS LastName,
                title              AS Title,
                bio                AS Bio,
                photo_url          AS PhotoUrl,
                is_active          AS IsActive
            FROM academic.teachers
            WHERE id = @TeacherId;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<TeacherDetailItem>(
            new CommandDefinition(sql, new { TeacherId = teacherId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<CommissionListItem>> ListCommissionsBySubjectAndTermAsync(
        Guid subjectId, Guid termId, CancellationToken ct = default)
    {
        // Join plano comisión + asignaciones + docente. Una fila por (comisión, docente); las
        // comisiones sin docente igual aparecen (LEFT JOIN, teacher fields null). initcap pasa el
        // nombre lowercase del storage a title case. El CASE ordena titular primero para display.
        const string sql = @"
            SELECT
                c.id                AS CommissionId,
                c.name              AS CommissionName,
                c.modality          AS Modality,
                c.capacity          AS Capacity,
                ct.teacher_id       AS TeacherId,
                initcap(t.first_name) AS FirstName,
                initcap(t.last_name)  AS LastName,
                ct.role             AS Role
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

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<CommissionTeacherRow>(
            new CommandDefinition(
                sql, new { SubjectId = subjectId, TermId = termId }, cancellationToken: ct));

        // GroupBy preserva el orden de primera aparición de cada comisión (ya vienen ordenadas por
        // nombre desde el SQL), así que el listado sale ordenado sin re-sort.
        return rows
            .GroupBy(r => (r.CommissionId, r.CommissionName, r.Modality, r.Capacity))
            .Select(g => new CommissionListItem(
                g.Key.CommissionId,
                g.Key.CommissionName,
                g.Key.Modality,
                g.Key.Capacity,
                g.Where(r => r.TeacherId.HasValue)
                    .Select(r => new CommissionTeacherItem(
                        r.TeacherId!.Value, r.FirstName!, r.LastName!, r.Role!))
                    .ToList()))
            .ToList();
    }

    private sealed record CommissionTeacherRow(
        Guid CommissionId,
        string CommissionName,
        string Modality,
        int? Capacity,
        Guid? TeacherId,
        string? FirstName,
        string? LastName,
        string? Role);

    public async Task<IReadOnlyList<CommissionTeacherItem>> GetCommissionTeachersAsync(
        Guid commissionId, CancellationToken ct = default)
    {
        // Mismos join + initcap + orden (titular primero) que ListCommissions, pero acotado a una
        // comisión por id. Sin LEFT JOIN: una comisión sin docentes devuelve lista vacía.
        const string sql = @"
            SELECT
                ct.teacher_id       AS TeacherId,
                initcap(t.first_name) AS FirstName,
                initcap(t.last_name)  AS LastName,
                ct.role             AS Role
            FROM academic.commission_teachers ct
            JOIN academic.teachers t ON t.id = ct.teacher_id
            WHERE ct.commission_id = @CommissionId
            ORDER BY
                CASE ct.role
                    WHEN 'Lead'          THEN 0
                    WHEN 'Associate'     THEN 1
                    WHEN 'PracticalLead' THEN 2
                    WHEN 'Assistant'     THEN 3
                    WHEN 'Guest'         THEN 4
                    ELSE 5
                END;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<CommissionTeacherItem>(
            new CommandDefinition(sql, new { CommissionId = commissionId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<AcademicTermListItem>> ListAcademicTermsByUniversityAsync(
        Guid universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                id            AS Id,
                university_id AS UniversityId,
                year          AS Year,
                number        AS Number,
                kind          AS Kind,
                label         AS Label
            FROM academic.academic_terms
            WHERE university_id = @UniversityId
            ORDER BY year DESC, number DESC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<AcademicTermListItem>(
            new CommandDefinition(sql, new { UniversityId = universityId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<string>> GetInstitutionalEmailDomainsForTeacherAsync(
        Guid teacherId, CancellationToken ct = default)
    {
        // text[] de Postgres → string[] de Npgsql en una sola columna. Sin row (docente inexistente)
        // devuelve null, que mapeamos a lista vacía.
        const string sql = @"
            SELECT u.institutional_email_domains
            FROM academic.teachers t
            JOIN academic.universities u ON u.id = t.university_id
            WHERE t.id = @TeacherId;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var domains = await db.QuerySingleOrDefaultAsync<string[]?>(
            new CommandDefinition(sql, new { TeacherId = teacherId }, cancellationToken: ct));

        return domains ?? [];
    }

    public async Task<IReadOnlyList<PublicPrerequisiteEdge>> ListPrerequisitesByCareerPlanAsync(
        Guid careerPlanId, CancellationToken ct = default)
    {
        // Doble join a subjects: una vez para la materia dependiente (s), otra para la requerida
        // (rs). Invariante del data-model: las dos materias de una correlativa son siempre del mismo
        // plan, así que alcanza con filtrar por el career_plan_id de un solo lado (s).
        const string sql = @"
            SELECT
                p.subject_id          AS SubjectId,
                s.code                AS SubjectCode,
                s.name                AS SubjectName,
                p.required_subject_id AS RequiredSubjectId,
                rs.code               AS RequiredSubjectCode,
                rs.name               AS RequiredSubjectName,
                p.type                AS Type
            FROM academic.prerequisites p
            JOIN academic.subjects s  ON s.id = p.subject_id
            JOIN academic.subjects rs ON rs.id = p.required_subject_id
            WHERE s.career_plan_id = @CareerPlanId
            ORDER BY s.code ASC, rs.code ASC, p.type ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<PublicPrerequisiteEdge>(
            new CommandDefinition(sql, new { CareerPlanId = careerPlanId }, cancellationToken: ct));
        return rows.AsList();
    }
}
