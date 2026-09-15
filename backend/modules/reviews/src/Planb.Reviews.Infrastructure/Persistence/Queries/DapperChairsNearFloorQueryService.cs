using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de qué cátedras de una carrera están a una reseña de cruzar el piso (US-134).
/// Mismo cruce cross-schema que <see cref="DapperCareerCoverageQueryService"/> (ADR-0017), y mismo
/// filtro de plan vigente (<c>cp.status = 'Active'</c>): una materia de un plan deprecado no
/// invita a reseñar algo que la cobertura de la carrera ya no cuenta.
/// </summary>
internal sealed class DapperChairsNearFloorQueryService : IChairsNearFloorQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperChairsNearFloorQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<ChairNearFloorIdentity>> ListAsync(
        Guid careerId, int reviewCount, CancellationToken ct = default)
    {
        const string sql = @"
            WITH plan_subjects AS (
                SELECT s.id
                FROM academic.subjects s
                JOIN academic.career_plans cp ON cp.id = s.career_plan_id
                WHERE cp.career_id = @CareerId
                  AND cp.status = 'Active'
                  AND s.is_active = true
            )
            SELECT
                ch.id         AS ChairId,
                ch.subject_id AS SubjectId,
                count(*)::int AS ReviewCount
            FROM academic.chairs ch
            JOIN reviews.reviews cr ON cr.chair_id = ch.id
            WHERE ch.is_active = true
              AND ch.subject_id IN (SELECT id FROM plan_subjects)
            GROUP BY ch.id, ch.subject_id
            HAVING count(*) = @ReviewCount;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<ChairNearFloorIdentity>(
            new CommandDefinition(
                sql,
                new { CareerId = careerId, ReviewCount = reviewCount },
                cancellationToken: ct));
        return rows.ToList();
    }
}
