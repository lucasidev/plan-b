using System.Globalization;
using Dapper;
using Planb.Academic.Application.Contracts;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del read-side cross-BC de Academic. Vive en Infrastructure como
/// internal porque ningun caller fuera de DI necesita instanciarlo (la interface está en
/// Contracts). Si la cantidad de queries crece más allá de unas pocas, se separan en archivos
/// por tema (ej. CareerPlanQueries, SubjectQueries) manteniendo cohesión.
/// </summary>
internal sealed class DapperAcademicQueryService : IAcademicQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperAcademicQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<bool> UniversityExistsAsync(Guid universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1
                FROM academic.universities
                WHERE id = @Id
            );";

        using var db = _connections.Create();
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

        using var db = _connections.Create();
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

        using var db = _connections.Create();
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
            WHERE is_active
            ORDER BY name ASC;";

        using var db = _connections.Create();
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
              AND is_active
            ORDER BY is_official DESC, name ASC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<CareerListItem>(
            new CommandDefinition(sql, new { UniversityId = universityId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<CareerDetailItem?> GetCareerByIdAsync(
        Guid careerId, CancellationToken ct = default)
    {
        // Una carrera desactivada no resuelve: su ficha deja de existir para el lector, mismo
        // criterio que GetSubjectByIdAsync/GetChairByIdAsync.
        const string sql = @"
            SELECT
                c.id             AS Id,
                c.name           AS Name,
                c.duration_years AS DurationYears,
                u.name           AS UniversityName
            FROM academic.careers c
            JOIN academic.universities u ON u.id = c.university_id
            WHERE c.id = @CareerId AND c.is_active = true;";

        using var db = _connections.Create();
        return await db.QuerySingleOrDefaultAsync<CareerDetailItem>(
            new CommandDefinition(sql, new { CareerId = careerId }, cancellationToken: ct));
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

        using var db = _connections.Create();
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

        using var db = _connections.Create();
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

        using var db = _connections.Create();
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

        using var db = _connections.Create();
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

        using var db = _connections.Create();
        return await db.QuerySingleOrDefaultAsync<TeacherDetailItem>(
            new CommandDefinition(sql, new { TeacherId = teacherId }, cancellationToken: ct));
    }

    public async Task<bool> IsAcademicTermInUniversityAsync(
        Guid termId, Guid universityId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1
                FROM academic.academic_terms
                WHERE id = @TermId AND university_id = @UniversityId
            );";

        using var db = _connections.Create();
        return await db.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                sql, new { TermId = termId, UniversityId = universityId }, cancellationToken: ct));
    }

    public async Task<bool> AcademicTermExistsAsync(Guid termId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1 FROM academic.academic_terms WHERE id = @TermId
            );";

        using var db = _connections.Create();
        return await db.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { TermId = termId }, cancellationToken: ct));
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
                label         AS Label,
                start_date    AS StartDate,
                end_date      AS EndDate
            FROM academic.academic_terms
            WHERE university_id = @UniversityId
            ORDER BY year DESC, number DESC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<AcademicTermListItem>(
            new CommandDefinition(sql, new { UniversityId = universityId }, cancellationToken: ct));
        return rows.AsList();
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

        using var db = _connections.Create();
        var rows = await db.QueryAsync<PublicPrerequisiteEdge>(
            new CommandDefinition(sql, new { CareerPlanId = careerPlanId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<ChairListItem>> ListChairsBySubjectAsync(
        Guid subjectId, CancellationToken ct = default)
    {
        // El titular vigente es el chair_member con role = 'Lead' y until_term_id IS NULL: a lo
        // sumo uno por cátedra (invariante del aggregate, Chair.AddMember), así que el LEFT JOIN no
        // duplica filas. Sin titular nombrado, teacher_id sale null y con él los campos de nombre;
        // la cátedra aparece igual. initcap pasa el nombre lowercase del storage a title case.
        const string sql = @"
            SELECT
                c.id                   AS Id,
                c.name                 AS Name,
                cm.teacher_id          AS LeadTeacherId,
                initcap(t.first_name)  AS LeadFirstName,
                initcap(t.last_name)   AS LeadLastName
            FROM academic.chairs c
            LEFT JOIN academic.chair_members cm
                ON cm.chair_id = c.id AND cm.role = 'Lead' AND cm.until_term_id IS NULL
            LEFT JOIN academic.teachers t ON t.id = cm.teacher_id
            WHERE c.subject_id = @SubjectId AND c.is_active = true
            ORDER BY c.name ASC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<ChairListItem>(
            new CommandDefinition(sql, new { SubjectId = subjectId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<ChairDetailItem?> GetChairByIdAsync(
        Guid chairId, CancellationToken ct = default)
    {
        // Mismo LEFT JOIN del titular vigente que ListChairsBySubjectAsync, más la materia, que la
        // ficha necesita para presentarse y para pedir sus hermanas. Una cátedra desactivada no
        // resuelve: su ficha deja de existir para el lector, aunque sus reseñas sigan guardadas.
        const string sql = @"
            SELECT
                c.id                   AS Id,
                c.name                 AS Name,
                s.id                   AS SubjectId,
                s.name                 AS SubjectName,
                s.code                 AS SubjectCode,
                cm.teacher_id          AS LeadTeacherId,
                initcap(t.first_name)  AS LeadFirstName,
                initcap(t.last_name)   AS LeadLastName
            FROM academic.chairs c
            JOIN academic.subjects s ON s.id = c.subject_id
            LEFT JOIN academic.chair_members cm
                ON cm.chair_id = c.id AND cm.role = 'Lead' AND cm.until_term_id IS NULL
            LEFT JOIN academic.teachers t ON t.id = cm.teacher_id
            WHERE c.id = @ChairId AND c.is_active = true;";

        using var db = _connections.Create();
        return await db.QuerySingleOrDefaultAsync<ChairDetailItem>(
            new CommandDefinition(sql, new { ChairId = chairId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<int>> ListTermYearsAsync(
        IReadOnlyList<Guid> termIds, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(termIds);
        if (termIds.Count == 0)
        {
            return [];
        }

        const string sql = @"
            SELECT DISTINCT year
            FROM academic.academic_terms
            WHERE id = ANY(@TermIds)
            ORDER BY year ASC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<int>(
            new CommandDefinition(sql, new { TermIds = termIds.ToArray() }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<TeacherChairItem>> ListChairsByTeacherAsync(
        Guid teacherId, CancellationToken ct = default)
    {
        // Vigente es no tener período de salida: el plantel se cierra poniendo `until_term_id`,
        // no borrando la fila, para que la ficha de la cátedra sepa a quién atribuirle cada año.
        // Las vigentes primero, y dentro de cada grupo por materia, que es como se las busca.
        const string sql = @"
            SELECT
                c.id                          AS ChairId,
                c.name                        AS ChairName,
                s.id                          AS SubjectId,
                s.name                        AS SubjectName,
                s.code                        AS SubjectCode,
                cm.role                       AS Role,
                (cm.until_term_id IS NULL)    AS IsCurrent
            FROM academic.chair_members cm
            JOIN academic.chairs c ON c.id = cm.chair_id
            JOIN academic.subjects s ON s.id = c.subject_id
            WHERE cm.teacher_id = @TeacherId
              AND c.is_active = true
              AND s.is_active = true
            ORDER BY (cm.until_term_id IS NULL) DESC, s.name ASC, c.name ASC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<TeacherChairItem>(
            new CommandDefinition(sql, new { TeacherId = teacherId }, cancellationToken: ct));
        return rows.AsList();
    }

    /// <summary>
    /// Las tres listas en un solo viaje con <c>QueryMultiple</c>. Cada `SELECT` filtra por
    /// <c>= ANY(@Ids)</c> y no por `IN`: con Npgsql el array va como un solo parámetro, así que el
    /// plan de la consulta no cambia con la cantidad de ids.
    ///
    /// <para>
    /// Una lista vacía no se saltea: el `SELECT` con array vacío devuelve cero filas y cuesta lo
    /// mismo que la rama que lo evitaría, y saltearlo condicionalmente rompería el orden de los
    /// grids que <c>QueryMultiple</c> lee en secuencia.
    /// </para>
    /// </summary>
    public async Task<CatalogLabels> GetLabelsAsync(
        IReadOnlyCollection<Guid> subjectIds,
        IReadOnlyCollection<Guid> termIds,
        IReadOnlyCollection<Guid> chairIds,
        CancellationToken ct = default)
    {
        if (subjectIds.Count == 0 && termIds.Count == 0 && chairIds.Count == 0)
        {
            return CatalogLabels.Empty;
        }

        const string sql = @"
            SELECT id AS Id, name AS Name, code AS Code
            FROM academic.subjects
            WHERE id = ANY(@SubjectIds);

            SELECT id AS Id, label AS Label
            FROM academic.academic_terms
            WHERE id = ANY(@TermIds);

            SELECT id AS Id, name AS Name
            FROM academic.chairs
            WHERE id = ANY(@ChairIds);";

        using var db = _connections.Create();
        using var grid = await db.QueryMultipleAsync(new CommandDefinition(
            sql,
            new
            {
                SubjectIds = subjectIds.ToArray(),
                TermIds = termIds.ToArray(),
                ChairIds = chairIds.ToArray(),
            },
            cancellationToken: ct));

        var subjects = (await grid.ReadAsync<SubjectLabelRow>())
            .ToDictionary(r => r.Id, r => new SubjectLabel(r.Name, r.Code));
        var terms = (await grid.ReadAsync<TermLabelRow>())
            .ToDictionary(r => r.Id, r => r.Label);
        var chairs = (await grid.ReadAsync<ChairLabelRow>())
            .ToDictionary(r => r.Id, r => r.Name);

        return new CatalogLabels(subjects, terms, chairs);
    }

    private sealed record SubjectLabelRow(Guid Id, string Name, string Code);

    private sealed record TermLabelRow(Guid Id, string Label);

    private sealed record ChairLabelRow(Guid Id, string Name);
}
