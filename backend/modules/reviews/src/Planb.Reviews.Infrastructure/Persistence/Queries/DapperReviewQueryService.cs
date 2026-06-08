using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Contracts;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper implementation of the cross-BC <see cref="IReviewQueryService"/>. Resolves a
/// review back to its author's user id with a single read crossing three schemas:
/// <c>reviews.reviews</c> -> <c>enrollments.enrollment_records</c> ->
/// <c>identity.student_profiles</c>. Cross-schema raw reads on read paths are allowed by
/// ADR-0018 (the ban in ADR-0017 is on FKs and EF navigation, not Dapper joins).
///
/// Soft-deleted reviews (US-055) return null: a deleted review has no reportable author.
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
            SELECT sp.user_id
            FROM reviews.reviews r
            JOIN enrollments.enrollment_records er
              ON er.id = r.enrollment_id
            JOIN identity.student_profiles sp
              ON sp.id = er.student_profile_id
            WHERE r.id = @ReviewId
              AND r.status <> 'Deleted';";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(sql, new { ReviewId = reviewId }, cancellationToken: ct));
    }
}
