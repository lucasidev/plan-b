namespace Planb.Reviews.Application.Features.GetMyPendingReviews;

/// <summary>
/// One row of the "pending reviews" listing surfaced by GET /api/reviews/me/pending (US-048).
///
/// Shape kept minimal on purpose: the frontend uses it to render a list with a "Write review"
/// CTA per item that links to the editor route with this <see cref="EnrollmentId"/>. The editor
/// itself fetches the richer context (commission, teacher, term details) once we have the
/// Commission + Teacher aggregates in Academic. Until then those fields are null/omitted: the
/// list shows code + name + period, which is enough to disambiguate.
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
    string Status,
    decimal? Grade,
    string? TermLabel);
