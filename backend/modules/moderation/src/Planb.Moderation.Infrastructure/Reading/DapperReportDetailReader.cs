using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Moderation.Application.Features.ReportDetail;

namespace Planb.Moderation.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del detalle de un report (US-051). Query cross-schema: el report + la reseña
/// (body, ratings, status) + el reporter + el autor de la reseña (derivado report → reseña →
/// enrollment → student_profile → user) con stats agregadas (reseñas escritas, reportes recibidos) +
/// los otros reports open de la misma reseña. Permitido por ADR-0017 para reads. Los strikes del autor
/// quedan para US-085 (acá no se devuelven).
/// </summary>
internal sealed class DapperReportDetailReader : IReportDetailReader
{
    private readonly string _connectionString;

    public DapperReportDetailReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperReportDetailReader.");
    }

    public async Task<ReportDetailResponse?> GetAsync(Guid reportId, CancellationToken ct = default)
    {
        const string detailSql = @"
            SELECT
                rr.id           AS ReportId,
                rr.reason       AS Reason,
                CASE
                    WHEN rr.reason IN ('DatosPersonales','LenguajeInapropiado') THEN 'urgent'
                    WHEN rr.reason IN ('Difamacion','Spam') THEN 'normal'
                    ELSE 'low'
                END             AS Tone,
                rr.details      AS Details,
                rr.created_at   AS ReportCreatedAt,
                rr.status       AS Status,
                rr.resolution_note AS ResolutionNote,
                rr.resolved_at  AS ResolvedAt,
                rr.moderator_user_id AS ModeratorUserId,
                rr.review_id    AS ReviewId,
                r.subject_text  AS SubjectText,
                r.teacher_text  AS TeacherText,
                r.difficulty_rating::int AS DifficultyRating,
                r.overall_rating::int    AS OverallRating,
                r.status        AS ReviewStatus,
                rr.reporter_user_id AS ReporterUserId,
                (ru.disabled_at IS NOT NULL) AS ReporterDisabled,
                author.user_id  AS AuthorUserId,
                au.created_at   AS AuthorAccountSince,
                (au.disabled_at IS NOT NULL) AS AuthorBanned,
                COALESCE((
                    SELECT count(*) FROM reviews.reviews rw
                    JOIN enrollments.enrollment_records ew ON ew.id = rw.enrollment_id
                    JOIN identity.student_profiles sw ON sw.id = ew.student_profile_id
                    WHERE sw.user_id = author.user_id AND rw.status <> 'Deleted'), 0)::int
                                AS AuthorReviewsWritten,
                COALESCE((
                    SELECT count(*) FROM moderation.review_reports mr
                    JOIN reviews.reviews rv ON rv.id = mr.review_id
                    JOIN enrollments.enrollment_records ev ON ev.id = rv.enrollment_id
                    JOIN identity.student_profiles sv ON sv.id = ev.student_profile_id
                    WHERE sv.user_id = author.user_id), 0)::int
                                AS AuthorReportsReceived
            FROM moderation.review_reports rr
            LEFT JOIN reviews.reviews r ON r.id = rr.review_id
            LEFT JOIN enrollments.enrollment_records er ON er.id = r.enrollment_id
            LEFT JOIN identity.student_profiles author ON author.id = er.student_profile_id
            LEFT JOIN identity.users au ON au.id = author.user_id
            LEFT JOIN identity.users ru ON ru.id = rr.reporter_user_id
            WHERE rr.id = @ReportId;

            SELECT id AS Id, reason AS Reason, created_at AS CreatedAt
            FROM moderation.review_reports
            WHERE status = 'Open'
              AND id <> @ReportId
              AND review_id = (SELECT review_id FROM moderation.review_reports WHERE id = @ReportId)
            ORDER BY created_at ASC;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        using var multi = await db.QueryMultipleAsync(
            new CommandDefinition(detailSql, new { ReportId = reportId }, cancellationToken: ct));

        var row = await multi.ReadSingleOrDefaultAsync<Row>();
        if (row is null)
        {
            return null;
        }
        var others = (await multi.ReadAsync<OtherOpenReport>()).ToList();

        return new ReportDetailResponse
        {
            ReportId = row.ReportId,
            Reason = row.Reason,
            Tone = row.Tone,
            Details = row.Details,
            ReportCreatedAt = row.ReportCreatedAt,
            Status = row.Status,
            ResolutionNote = row.ResolutionNote,
            ResolvedAt = row.ResolvedAt,
            ModeratorUserId = row.ModeratorUserId,
            ReviewId = row.ReviewId,
            SubjectText = row.SubjectText,
            TeacherText = row.TeacherText,
            DifficultyRating = row.DifficultyRating,
            OverallRating = row.OverallRating,
            ReviewStatus = row.ReviewStatus,
            ReporterUserId = row.ReporterUserId,
            ReporterDisabled = row.ReporterDisabled,
            AuthorUserId = row.AuthorUserId,
            AuthorAccountSince = row.AuthorAccountSince,
            AuthorReviewsWritten = row.AuthorReviewsWritten,
            AuthorReportsReceived = row.AuthorReportsReceived,
            AuthorBanned = row.AuthorBanned,
            OtherOpenReports = others,
        };
    }

    private sealed record Row
    {
        public Guid ReportId { get; init; }
        public string Reason { get; init; } = string.Empty;
        public string Tone { get; init; } = "low";
        public string? Details { get; init; }
        public DateTime ReportCreatedAt { get; init; }
        public string Status { get; init; } = string.Empty;
        public string? ResolutionNote { get; init; }
        public DateTime? ResolvedAt { get; init; }
        public Guid? ModeratorUserId { get; init; }
        public Guid ReviewId { get; init; }
        public string? SubjectText { get; init; }
        public string? TeacherText { get; init; }
        public int? DifficultyRating { get; init; }
        public int? OverallRating { get; init; }
        public string? ReviewStatus { get; init; }
        public Guid ReporterUserId { get; init; }
        public bool ReporterDisabled { get; init; }
        public Guid? AuthorUserId { get; init; }
        public DateTime? AuthorAccountSince { get; init; }
        public bool AuthorBanned { get; init; }
        public int AuthorReviewsWritten { get; init; }
        public int AuthorReportsReceived { get; init; }
    }
}
