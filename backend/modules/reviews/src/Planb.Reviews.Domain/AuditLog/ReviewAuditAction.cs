namespace Planb.Reviews.Domain.AuditLog;

/// <summary>
/// Closed enumeration of review-level audit actions. Persisted as text (HasConversion in
/// EF config) so new values do not require a migration when added.
///
/// Current set covers the three US that mutate a Review's life cycle from outside the
/// publish flow:
/// <list type="bullet">
///   <item><c>Edited</c>: author edited via PATCH (US-018). Changes JSON shape:
///         <c>{ before: {...}, after: {...} }</c>.</item>
///   <item><c>Deleted</c>: author soft-deleted via DELETE (US-055).</item>
///   <item><c>Reported</c>: a reporter raised a moderation report (US-019).</item>
///   <item><c>ModeratorDecision</c>: moderator upheld or dismissed a report (US-051).</item>
/// </list>
/// </summary>
public enum ReviewAuditAction
{
    Edited,
    Deleted,
    Reported,
    ModeratorDecision,

    /// <summary>US-040: un docente verificado publicó su respuesta a la reseña.</summary>
    ResponsePublished,
}
