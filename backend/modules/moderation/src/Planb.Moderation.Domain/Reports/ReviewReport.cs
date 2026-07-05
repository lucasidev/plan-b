using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Moderation.Domain.Reports;

/// <summary>
/// Aggregate root of the Moderation bounded context (US-019). A single report filed by one
/// user against one review. The report is itself the audit record of "who reported what,
/// when, and why": there is no separate audit-log table on the Moderation side.
///
/// <para>
/// Cross-BC by UUID only (ADR-0017): <see cref="ReviewId"/> points at a review in the
/// Reviews context and <see cref="ReporterUserId"/> at a user in Identity, both without
/// Postgres FKs. The reporter-is-not-author check and the review-exists check are done in
/// the handler against the Reviews contract before the factory runs.
/// </para>
///
/// <para>
/// Uniqueness (one report per reviewer per review) is enforced by a DB UNIQUE index plus a
/// handler-side pre-check; the aggregate does not know about sibling reports.
/// </para>
/// </summary>
public sealed class ReviewReport : Entity<ReviewReportId>, IAggregateRoot
{
    public const int MaxDetailsLength = 2000;
    public const int MaxResolutionNoteLength = 1000;

    public Guid ReviewId { get; private set; }
    public Guid ReporterUserId { get; private set; }
    public ReviewReportReason Reason { get; private set; }
    public string? Details { get; private set; }
    public ReviewReportStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>Moderador que resolvió el report (US-051). Null mientras el report está Open.</summary>
    public Guid? ModeratorUserId { get; private set; }

    /// <summary>Nota interna del moderador al resolver (US-051). Opcional, máx 1000 chars.</summary>
    public string? ResolutionNote { get; private set; }

    /// <summary>Cuándo se resolvió (US-051). Null mientras Open.</summary>
    public DateTimeOffset? ResolvedAt { get; private set; }

    private ReviewReport() { }

    /// <summary>
    /// Creates an open report. Validates only the aggregate-local invariant (details length);
    /// the cross-BC checks (review exists, reporter != author, not a duplicate) are the
    /// handler's responsibility before this is called.
    /// </summary>
    public static Result<ReviewReport> Create(
        Guid reviewId,
        Guid reporterUserId,
        ReviewReportReason reason,
        string? details,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var trimmed = string.IsNullOrWhiteSpace(details) ? null : details.Trim();
        if (trimmed is { Length: > MaxDetailsLength })
        {
            return Result.Failure<ReviewReport>(ReviewReportErrors.DetailsTooLong);
        }

        return Result.Success(new ReviewReport
        {
            Id = ReviewReportId.New(),
            ReviewId = reviewId,
            ReporterUserId = reporterUserId,
            Reason = reason,
            Details = trimmed,
            Status = ReviewReportStatus.Open,
            CreatedAt = clock.UtcNow,
        });
    }

    /// <summary>
    /// El moderador da lugar al report (US-051, uphold): decisión de que la reseña viola la política.
    /// Transición terminal desde <see cref="ReviewReportStatus.Open"/>; si ya está resuelto devuelve
    /// <see cref="ReviewReportErrors.AlreadyResolved"/> (409, otro moderador ganó la race). La remoción
    /// de la reseña la aplica el contexto Reviews vía integration event; acá solo se marca el report.
    /// </summary>
    public Result Uphold(Guid moderatorUserId, string? resolutionNote, IDateTimeProvider clock) =>
        Resolve(ReviewReportStatus.Upheld, moderatorUserId, resolutionNote, clock);

    /// <summary>
    /// El moderador desestima el report (US-051, dismiss): la crítica es legítima, la reseña se queda.
    /// Transición terminal desde <see cref="ReviewReportStatus.Open"/>.
    /// </summary>
    public Result Dismiss(Guid moderatorUserId, string? resolutionNote, IDateTimeProvider clock) =>
        Resolve(ReviewReportStatus.Dismissed, moderatorUserId, resolutionNote, clock);

    private Result Resolve(
        ReviewReportStatus terminal,
        Guid moderatorUserId,
        string? resolutionNote,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status != ReviewReportStatus.Open)
        {
            return ReviewReportErrors.AlreadyResolved;
        }

        var trimmed = string.IsNullOrWhiteSpace(resolutionNote) ? null : resolutionNote.Trim();
        if (trimmed is { Length: > MaxResolutionNoteLength })
        {
            return ReviewReportErrors.ResolutionNoteTooLong;
        }

        Status = terminal;
        ModeratorUserId = moderatorUserId;
        ResolutionNote = trimmed;
        ResolvedAt = clock.UtcNow;
        return Result.Success();
    }
}
