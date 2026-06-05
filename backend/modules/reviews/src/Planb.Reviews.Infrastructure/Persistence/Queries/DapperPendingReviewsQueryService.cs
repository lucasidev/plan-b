using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.GetMyPendingReviews;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read-side of US-048 tab "Pendientes". Lives in Infrastructure because the SQL crosses
/// three schemas (enrollments, academic, reviews). ADR-0017 prohibits FKs and EF nav cross-schema
/// but explicitly leaves room for raw Dapper joins on read paths (ADR-0018): we cross schemas in
/// a single read-only query string, which is the cheapest way to compose a list view without
/// fan-out calls per row.
///
/// Definition of "pending":
///   - enrollment.status != 'Cursando' (terminal states: Aprobada, Regular, Reprobada, Abandonada)
///   - AND no row in reviews.reviews for that enrollment_id
///
/// Sorting: most recently created enrollment first, so the most recently closed cursadas surface
/// at the top of the list. Frontend can re-sort later if needed.
///
/// Teacher and commission are intentionally not joined: the Teacher and Commission aggregates do
/// not exist in Academic yet (will land with US-063 / US-065 per the US-048 doc). When they do,
/// extend the query and the <see cref="PendingReviewItem"/> shape together.
/// </summary>
internal sealed class DapperPendingReviewsQueryService : IPendingReviewsQueryService
{
    private readonly string _connectionString;

    public DapperPendingReviewsQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperPendingReviewsQueryService.");
    }

    public async Task<IReadOnlyList<PendingReviewItem>> GetForStudentAsync(
        Guid studentProfileId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                er.id                                                       AS EnrollmentId,
                er.subject_id                                               AS SubjectId,
                s.code                                                      AS SubjectCode,
                s.name                                                      AS SubjectName,
                er.status                                                   AS Status,
                er.grade                                                    AS Grade,
                CASE
                    WHEN t.id IS NULL THEN NULL
                    ELSE CONCAT(t.year::text, '·', t.number::text, 'c')
                END                                                         AS TermLabel
            FROM enrollments.enrollment_records er
            JOIN academic.subjects s
              ON s.id = er.subject_id
            LEFT JOIN academic.academic_terms t
              ON t.id = er.term_id
            LEFT JOIN reviews.reviews r
              ON r.enrollment_id = er.id
            WHERE er.student_profile_id = @StudentProfileId
              AND er.status <> 'Cursando'
              AND r.id IS NULL
            ORDER BY er.created_at DESC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<PendingReviewItem>(
            new CommandDefinition(sql, new { StudentProfileId = studentProfileId }, cancellationToken: ct));
        return rows.AsList();
    }
}
