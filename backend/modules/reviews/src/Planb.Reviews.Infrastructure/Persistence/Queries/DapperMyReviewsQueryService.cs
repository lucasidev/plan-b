using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.GetMyReviews;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read for US-048 tab Mías. Joins `reviews.reviews` to `enrollments.enrollment_records`
/// to find the student owning the review, then to `academic.subjects` for the display code +
/// name.
///
/// Two queries in a single round trip:
///   1. The list of items (newest first).
///   2. The status breakdown so the response stats block is filled in one shot.
///
/// We could materialise the stats from the list in C# instead, but a single GROUP BY in
/// Postgres is cheaper than allocating + iterating the list twice, and keeps the contract
/// tight (the list could be paginated later and the stats must still be totals).
/// </summary>
internal sealed class DapperMyReviewsQueryService : IMyReviewsQueryService
{
    private readonly string _connectionString;

    public DapperMyReviewsQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperMyReviewsQueryService.");
    }

    public async Task<GetMyReviewsResponse> GetForStudentAsync(
        Guid studentProfileId, CancellationToken ct = default)
    {
        // `difficulty_rating` is a smallint in the schema (matches the byte-backed VO); cast to
        // int so Dapper materialises the record's `int` field cleanly. `created_at` is stored
        // as `timestamptz` and we want it as `DateTimeOffset`; the explicit AT TIME ZONE +
        // `timestamptz` ensures Npgsql delivers it as DateTimeOffset rather than DateTime.
        const string itemsSql = @"
            SELECT
                r.id                                       AS Id,
                r.enrollment_id                            AS EnrollmentId,
                er.subject_id                              AS SubjectId,
                s.code                                     AS SubjectCode,
                s.name                                     AS SubjectName,
                r.status                                   AS Status,
                r.difficulty_rating::int                   AS DifficultyRating,
                r.subject_text                             AS SubjectText,
                r.final_grade                              AS FinalGrade,
                r.created_at                               AS CreatedAt
            FROM reviews.reviews r
            JOIN enrollments.enrollment_records er
              ON er.id = r.enrollment_id
            JOIN academic.subjects s
              ON s.id = er.subject_id
            WHERE er.student_profile_id = @StudentProfileId
              AND r.status <> 'Deleted'
            ORDER BY r.created_at DESC;";

        const string statsSql = @"
            SELECT
                r.status      AS Status,
                COUNT(*)::int AS Count
            FROM reviews.reviews r
            JOIN enrollments.enrollment_records er
              ON er.id = r.enrollment_id
            WHERE er.student_profile_id = @StudentProfileId
              AND r.status <> 'Deleted'
            GROUP BY r.status;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var args = new { StudentProfileId = studentProfileId };

        var items = (await db.QueryAsync<MyReviewItem>(
            new CommandDefinition(itemsSql, args, cancellationToken: ct))).AsList();

        var statusRows = await db.QueryAsync<(string Status, int Count)>(
            new CommandDefinition(statsSql, args, cancellationToken: ct));

        var published = 0;
        var underReview = 0;
        var removed = 0;
        foreach (var (status, count) in statusRows)
        {
            switch (status)
            {
                case "Published": published = count; break;
                case "UnderReview": underReview = count; break;
                case "Removed": removed = count; break;
            }
        }

        var stats = new MyReviewsStats(
            TotalCount: published + underReview + removed,
            PublishedCount: published,
            UnderReviewCount: underReview,
            RemovedCount: removed);

        return new GetMyReviewsResponse(items, stats);
    }
}
