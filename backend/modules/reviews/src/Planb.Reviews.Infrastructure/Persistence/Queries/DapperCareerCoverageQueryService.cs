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
}
