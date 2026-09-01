using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de las cátedras que una cuenta reseñó, con las voces de cada una (US-231).
///
/// <para>
/// No cruza esquemas: <c>account_id</c> y <c>chair_id</c> viven los dos en
/// <c>reviews.reviews</c>, y el nombre de la cátedra lo compone el frontend con lo que ya
/// pidió a <c>/api/reviews/courses/me</c>.
/// </para>
/// </summary>
internal sealed class DapperMyReviewedChairsQueryService : IMyReviewedChairsQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperMyReviewedChairsQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<MyReviewedChairView>> ListAsync(
        Guid accountId, CancellationToken ct = default)
    {
        // El subquery acota a las cátedras propias; el count de afuera cuenta TODAS las reseñas de
        // esas cátedras, no solo las de esta cuenta: lo que hace publicar a una cátedra es su
        // total, y el propio aporte es una de esas voces.
        //
        // La reseña sin cátedra ("no sé cuál me tocó") no entra: no hay sujeto del que decir si
        // publica.
        const string sql = @"
            SELECT
                cr.chair_id AS ChairId,
                count(*)::int AS ReviewCount
            FROM reviews.reviews cr
            WHERE cr.chair_id IN (
                SELECT DISTINCT mine.chair_id
                FROM reviews.reviews mine
                WHERE mine.account_id = @AccountId
                  AND mine.chair_id IS NOT NULL
            )
            GROUP BY cr.chair_id;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<MyReviewedChairView>(
            new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: ct));

        return rows.ToList();
    }
}
