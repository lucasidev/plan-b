using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.BrowseReviews;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read for US-048 tab Explorar. Joins `reviews.reviews` to
/// `enrollments.enrollment_records` (to know which subject the review belongs to) and
/// `academic.subjects` (for the display code/name + the optional career_plan_id filter).
///
/// Filtering is applied via parameterised conditions that are no-ops when the filter is
/// null. The total count is calculated with a window function so we don't run a second
/// COUNT query: every row already carries the total of the filtered set, which we read
/// from any row (or set to 0 when the page is empty).
///
/// Only Published reviews are exposed. UnderReview rows live in moderation purgatory and
/// Removed rows are soft-deleted; both are invisible to the public feed by design.
/// </summary>
internal sealed class DapperBrowseReviewsQueryService : IBrowseReviewsQueryService
{
    private readonly string _connectionString;

    public DapperBrowseReviewsQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperBrowseReviewsQueryService.");
    }

    public async Task<BrowseReviewsResponse> BrowseAsync(
        BrowseReviewsQuery query, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                r.id                                       AS Id,
                er.subject_id                              AS SubjectId,
                s.code                                     AS SubjectCode,
                s.name                                     AS SubjectName,
                r.difficulty_rating::int                   AS DifficultyRating,
                r.overall_rating::int                      AS OverallRating,
                r.hours_per_week::int                      AS HoursPerWeek,
                r.tags                                     AS Tags,
                r.would_recommend_course                   AS WouldRecommendCourse,
                r.would_retake_teacher                     AS WouldRetakeTeacher,
                r.subject_text                             AS SubjectText,
                r.final_grade                              AS FinalGrade,
                r.created_at                               AS CreatedAt,
                COUNT(*) OVER ()::int                      AS TotalCount
            FROM reviews.reviews r
            JOIN enrollments.enrollment_records er
              ON er.id = r.enrollment_id
            JOIN academic.subjects s
              ON s.id = er.subject_id
            WHERE r.status = 'Published'
              AND (@SubjectId       IS NULL OR er.subject_id    = @SubjectId)
              AND (@CareerPlanId    IS NULL OR s.career_plan_id = @CareerPlanId)
              AND (@DifficultyRating IS NULL OR r.difficulty_rating = @DifficultyRating)
            ORDER BY r.created_at DESC
            OFFSET @Offset LIMIT @Limit;";

        var offset = (query.Page - 1) * query.PageSize;
        var args = new
        {
            query.SubjectId,
            query.CareerPlanId,
            query.DifficultyRating,
            Offset = offset,
            Limit = query.PageSize,
        };

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = (await db.QueryAsync<Row>(
            new CommandDefinition(sql, args, cancellationToken: ct))).AsList();

        var items = new List<BrowseReviewItem>(rows.Count);
        var total = rows.Count > 0 ? rows[0].TotalCount : 0;
        foreach (var r in rows)
        {
            items.Add(new BrowseReviewItem(
                Id: r.Id,
                SubjectId: r.SubjectId,
                SubjectCode: r.SubjectCode,
                SubjectName: r.SubjectName,
                DifficultyRating: r.DifficultyRating,
                OverallRating: r.OverallRating,
                HoursPerWeek: r.HoursPerWeek,
                Tags: r.Tags ?? [],
                WouldRecommendCourse: r.WouldRecommendCourse,
                WouldRetakeTeacher: r.WouldRetakeTeacher,
                SubjectText: r.SubjectText,
                FinalGrade: r.FinalGrade,
                CreatedAt: r.CreatedAt));
        }

        return new BrowseReviewsResponse(items, query.Page, query.PageSize, total);
    }

    // Internal row mirrors the SELECT shape (item fields + TotalCount window). Splitting the
    // projection here keeps the public DTO free of the COUNT-OVER plumbing.
    //
    // This is a class with settable properties (not a positional record) on purpose: the `tags`
    // column comes back as a Postgres text[] which the reader exposes as System.Array. Dapper's
    // constructor-matching path cannot bind System.Array to a `string[]` constructor parameter
    // and throws ("a parameterless default constructor ... is required"), even on an empty result
    // (it inspects the schema before reading rows). The parameterless-ctor + property-setter path
    // assigns each column by name and handles the array fine.
    private sealed class Row
    {
        public Guid Id { get; set; }
        public Guid SubjectId { get; set; }
        public string SubjectCode { get; set; } = "";
        public string SubjectName { get; set; } = "";
        public int DifficultyRating { get; set; }
        public int OverallRating { get; set; }
        public int? HoursPerWeek { get; set; }
        public string[]? Tags { get; set; }
        public bool WouldRecommendCourse { get; set; }
        public bool WouldRetakeTeacher { get; set; }
        public string? SubjectText { get; set; }
        public decimal? FinalGrade { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalCount { get; set; }
    }
}
