using Planb.SharedKernel.Primitives;

namespace Planb.Moderation.Domain.Reports;

public static class ReviewReportErrors
{
    /// <summary>
    /// The review being reported does not exist (or was deleted by its author). 404.
    /// </summary>
    public static readonly Error ReviewNotFound =
        Error.NotFound(
            "moderation.report.review_not_found",
            "Review not found.");

    /// <summary>
    /// The reporter is the author of the review. You cannot report your own review. 403.
    /// </summary>
    public static readonly Error CannotReportOwnReview =
        Error.Forbidden(
            "moderation.report.cannot_report_own_review",
            "You cannot report your own review.");

    /// <summary>
    /// This reporter already filed a report for this review (UNIQUE review_id + reporter). 409.
    /// </summary>
    public static readonly Error AlreadyReported =
        Error.Conflict(
            "moderation.report.already_reported",
            "You already reported this review.");

    /// <summary>
    /// Free-text details exceeded the maximum length. 400.
    /// </summary>
    public static readonly Error DetailsTooLong =
        Error.Validation(
            "moderation.report.details_too_long",
            "Report details must be at most 2000 characters.");

    /// <summary>
    /// Per-reporter rate limit exceeded (max 10 reports/hour). 429.
    /// </summary>
    public static readonly Error RateLimitExceeded =
        Error.Conflict(
            "moderation.report.rate_limit_exceeded",
            "Too many reports. Try again later.");

    /// <summary>
    /// The report id passed to the resolve flow (uphold/dismiss/detail) does not exist. 404. US-051.
    /// </summary>
    public static readonly Error ReportNotFound =
        Error.NotFound(
            "moderation.report.not_found",
            "Report not found.");

    /// <summary>
    /// Uphold/dismiss on a report that is no longer Open (another moderator resolved it first). 409,
    /// idempotencia explícita (US-051): el frontend sabe que la decisión ya la tomó otro moderador.
    /// </summary>
    public static readonly Error AlreadyResolved =
        Error.Conflict(
            "moderation.report.already_resolved",
            "This report has already been resolved.");

    /// <summary>
    /// The moderator resolution note exceeded the maximum length. 400. US-051.
    /// </summary>
    public static readonly Error ResolutionNoteTooLong =
        Error.Validation(
            "moderation.report.resolution_note_too_long",
            $"Resolution note must be at most {ReviewReport.MaxResolutionNoteLength} characters.");
}
