namespace Planb.Moderation.Domain.Reports;

/// <summary>
/// Lifecycle of a single <see cref="ReviewReport"/>. Persisted as text. US-019 only creates
/// reports in <see cref="Open"/>; the terminal states are written by the moderator
/// resolution flow (US-051) and listed here so the column domain is stable when it lands.
/// </summary>
public enum ReviewReportStatus
{
    /// <summary>Awaiting moderator decision. Counts toward the auto-hide threshold.</summary>
    Open,

    /// <summary>Moderator upheld the report (review removed). US-051.</summary>
    Upheld,

    /// <summary>Moderator dismissed the report (review kept). US-051.</summary>
    Dismissed,
}
