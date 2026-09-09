using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de la cobertura de una carrera (US-134). Cuenta y no decide: el piso lo define
/// <c>PublishingRules.ChairMinimumReviews</c>, y llega acá como parámetro para no duplicarlo.
///
/// <para>
/// Cruza <c>academic.subjects</c>/<c>academic.chairs</c> con <c>reviews.reviews</c> en una
/// sola consulta. Es el caso que ADR-0017 nombra explícitamente para analítica cross-module
/// (JOIN Dapper saltando el DbContext): resolverlo materia por materia contra
/// <c>IAcademicQueryService</c> sería un round-trip por cada materia del plan, solo para contar
/// cuántas tienen una cátedra que publica.
/// </para>
/// </summary>
internal sealed class DapperCareerCoverageQueryService : ICareerCoverageQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperCareerCoverageQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<CareerCoverage> GetCoverageAsync(
        Guid careerId, int minimumReviews, CancellationToken ct = default)
    {
        // El plan vigente es el o los planes en status Active de la carrera (una reforma en curso
        // puede dejar dos conviviendo, US-204): el denominador toma las materias activas de todos
        // ellos. Fusionar "materias canónicas" entre planes (D04) es trabajo de esa story; hoy cada
        // fila de subjects cuenta una vez, sin unir entre planes.
        const string sql = @"
            WITH plan_subjects AS (
                SELECT s.id
                FROM academic.subjects s
                JOIN academic.career_plans cp ON cp.id = s.career_plan_id
                WHERE cp.career_id = @CareerId
                  AND cp.status = 'Active'
                  AND s.is_active = true
            ),
            covered_chairs AS (
                SELECT ch.subject_id
                FROM academic.chairs ch
                JOIN reviews.reviews cr ON cr.chair_id = ch.id
                WHERE ch.is_active = true
                  AND ch.subject_id IN (SELECT id FROM plan_subjects)
                GROUP BY ch.id, ch.subject_id
                HAVING count(*) >= @MinimumReviews
            )
            SELECT
                (SELECT count(*)::int FROM plan_subjects) AS TotalSubjects,
                (SELECT count(DISTINCT subject_id)::int FROM covered_chairs) AS CoveredSubjects;";

        using var db = _connections.Create();
        return await db.QuerySingleAsync<CareerCoverage>(
            new CommandDefinition(
                sql,
                new { CareerId = careerId, MinimumReviews = minimumReviews },
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<Guid>> GetCoveredSubjectIdsAsync(
        Guid careerPlanId, int minimumReviews, CancellationToken ct = default)
    {
        // Mismo cruce que GetCoverageAsync (chairs activos con >= MinimumReviews reseñas), acotado
        // a las materias de ESE plan en vez de a los planes activos de una carrera entera.
        const string sql = @"
            SELECT DISTINCT ch.subject_id
            FROM academic.chairs ch
            JOIN academic.subjects s ON s.id = ch.subject_id
            JOIN reviews.reviews cr ON cr.chair_id = ch.id
            WHERE ch.is_active = true
              AND s.is_active = true
              AND s.career_plan_id = @CareerPlanId
            GROUP BY ch.id, ch.subject_id
            HAVING count(*) >= @MinimumReviews;";

        using var db = _connections.Create();
        var subjectIds = await db.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new { CareerPlanId = careerPlanId, MinimumReviews = minimumReviews },
                cancellationToken: ct));
        return subjectIds.ToList();
    }

    public async Task<IReadOnlyDictionary<Guid, CareerCoverageBatch>> GetCoverageBatchAsync(
        IReadOnlyCollection<Guid> careerIds, int minimumReviews, CancellationToken ct = default)
    {
        // Mismo cruce que GetCoverageAsync, para varias carreras a la vez: un solo WHERE con
        // = ANY(@CareerIds) en vez de un viaje por carrera (con 230 carreras, N consultas no es una
        // opción). chair_tallies se pre-agrega a una fila por materia en subject_voices antes de
        // llegar al join final (mismo motivo que antes: una materia con dos cátedras aportaría dos
        // filas con su mismo subject_id, y sin des-fanear primero el join de más abajo multiplicaría
        // TotalSubjects). Esa fila por materia ya decide, cátedra por cátedra, qué reseñas publican
        // (piso) y cuáles quedan cargando sin cruzarlo todavía.
        const string sql = @"
            WITH plan_subjects AS (
                SELECT s.id AS subject_id, cp.career_id
                FROM academic.subjects s
                JOIN academic.career_plans cp ON cp.id = s.career_plan_id
                WHERE cp.career_id = ANY(@CareerIds)
                  AND cp.status = 'Active'
                  AND s.is_active = true
            ),
            chair_tallies AS (
                SELECT ch.subject_id, count(*) AS review_count
                FROM academic.chairs ch
                JOIN reviews.reviews cr ON cr.chair_id = ch.id
                WHERE ch.is_active = true
                  AND ch.subject_id IN (SELECT subject_id FROM plan_subjects)
                GROUP BY ch.id, ch.subject_id
            ),
            subject_voices AS (
                SELECT
                    subject_id,
                    COALESCE(sum(review_count) FILTER (WHERE review_count >= @MinimumReviews), 0)
                        AS published_voice_count,
                    bool_or(review_count < @MinimumReviews) AS has_activity_below_floor
                FROM chair_tallies
                GROUP BY subject_id
            )
            SELECT
                ps.career_id                                              AS CareerId,
                count(ps.subject_id)::int                                 AS TotalSubjects,
                count(*) FILTER (WHERE sv.published_voice_count > 0)::int AS CoveredSubjects,
                COALESCE(sum(sv.published_voice_count), 0)::int           AS VoiceCount,
                bool_or(COALESCE(sv.has_activity_below_floor, false))     AS HasReviewsBelowFloor
            FROM plan_subjects ps
            LEFT JOIN subject_voices sv ON sv.subject_id = ps.subject_id
            GROUP BY ps.career_id;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<CareerCoverageBatchRow>(
            new CommandDefinition(
                sql,
                new { CareerIds = careerIds.ToArray(), MinimumReviews = minimumReviews },
                cancellationToken: ct));

        return rows.ToDictionary(
            r => r.CareerId,
            r => new CareerCoverageBatch(
                r.TotalSubjects, r.CoveredSubjects, r.VoiceCount, r.HasReviewsBelowFloor));
    }

    private sealed record CareerCoverageBatchRow(
        Guid CareerId,
        int TotalSubjects,
        int CoveredSubjects,
        int VoiceCount,
        bool HasReviewsBelowFloor);
}
