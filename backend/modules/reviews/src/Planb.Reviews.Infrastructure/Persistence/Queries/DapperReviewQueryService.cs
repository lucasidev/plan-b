using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Contracts;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Impl Dapper del contrato cross-BC <see cref="IReviewQueryService"/>. Lee el autor directo de
/// <c>reviews.reviews.author_user_id</c>: una sola tabla, sin cruzar schemas.
///
/// <para>
/// Antes resolvía el autor con un JOIN de tres schemas (reviews -&gt; enrollment_records -&gt;
/// student_profiles), y eso lo hacía romperse con la baja de cuenta: <c>User.Deactivate</c> borra el
/// student_profile, así que el autor quedaba irresoluble y reportar la reseña devolvía 404 sobre una
/// reseña que seguía publicada y visible. La columna desnormalizada que prescribe ADR-0044 cierra
/// ese agujero, y de paso saca el cruce de schemas del read path.
/// </para>
///
/// <para>
/// Una reseña borrada (US-055) devuelve null: no tiene autor reportable.
/// </para>
/// </summary>
internal sealed class DapperReviewQueryService : IReviewQueryService
{
    private readonly string _connectionString;

    public DapperReviewQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperReviewQueryService.");
    }

    public async Task<Guid?> GetAuthorUserIdAsync(Guid reviewId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT author_user_id
            FROM reviews.reviews
            WHERE id = @ReviewId
              AND status <> 'Deleted';";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(sql, new { ReviewId = reviewId }, cancellationToken: ct));
    }
}
