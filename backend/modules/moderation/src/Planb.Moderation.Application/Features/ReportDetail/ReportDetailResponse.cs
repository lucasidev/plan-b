namespace Planb.Moderation.Application.Features.ReportDetail;

/// <summary>
/// Detalle de un report para la pantalla de decisión del moderador (US-051): el report + la reseña
/// reportada + el reporter + contexto agregado del autor + los otros reports open de la misma reseña
/// (preview del cascade). Identidades visibles al staff (ADR-0009: el anonimato es solo público).
/// Record property-init; los campos se componen desde dos queries Dapper.
/// </summary>
public sealed record ReportDetailResponse
{
    // ── Report ───────────────────────────────────────────────
    public Guid ReportId { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string Tone { get; init; } = "low";
    public string? Details { get; init; }
    public DateTime ReportCreatedAt { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? ResolutionNote { get; init; }
    public DateTime? ResolvedAt { get; init; }
    public Guid? ModeratorUserId { get; init; }

    // ── Reseña reportada ─────────────────────────────────────
    public Guid ReviewId { get; init; }
    public string? SubjectText { get; init; }
    public string? TeacherText { get; init; }
    public int? DifficultyRating { get; init; }
    public int? OverallRating { get; init; }
    public string? ReviewStatus { get; init; }

    // ── Reporter ─────────────────────────────────────────────
    public Guid ReporterUserId { get; init; }
    public bool ReporterDisabled { get; init; }

    // ── Contexto del autor de la reseña ──────────────────────
    public Guid? AuthorUserId { get; init; }
    public DateTime? AuthorAccountSince { get; init; }
    public int AuthorReviewsWritten { get; init; }
    public int AuthorReportsReceived { get; init; }
    public bool AuthorBanned { get; init; }

    // ── Otros reports open de la misma reseña (cascade preview) ─
    public IReadOnlyList<OtherOpenReport> OtherOpenReports { get; init; } = [];
}

/// <summary>Un report open de la misma reseña, distinto del actual (US-051, preview del cascade).</summary>
public sealed record OtherOpenReport
{
    public Guid Id { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
