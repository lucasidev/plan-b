namespace Planb.Reviews.Application.Features.GetMyPendingReviews;

/// <summary>
/// One row of the "pending reviews" listing surfaced by GET /api/reviews/me/pending (US-048).
///
/// Only enrollments that are actually reviewable surface here: terminal status, no live review, and
/// a non-null <see cref="CommissionId"/>. An enrollment without a commission cannot be reviewed (the
/// publish handler rejects it), so showing it with a "Write review" CTA that then fails would be a
/// dead end; it is filtered out. The editor uses <see cref="CommissionId"/> to fetch the commission's
/// teachers and let the student pick who to review ("docente real por reseña").
///
/// <para>
/// <see cref="TermLabel"/> example: "2025·2c". May be null for older enrollments without a
/// linked academic term.
/// </para>
/// </summary>
public sealed record PendingReviewItem(
    Guid EnrollmentId,
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    Guid CommissionId,
    string Status,
    decimal? Grade,
    string? TermLabel);
