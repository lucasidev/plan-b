using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.AuditLog;

/// <summary>
/// Append-only audit trail for review-level actions (US-018 edit, US-055 delete, US-051
/// moderator decisions). Lives in the Reviews bounded context because it tracks the
/// review's life cycle from the review's point of view; moderation has its own audit log
/// (ReviewReport + report actions, US-019 and US-051).
///
/// <para>
/// Not an aggregate root: rows are written from within a Review-aggregate transaction by
/// the handler that owns the action. The diff payload is stored as JSON text and shaped
/// per action (for example, "edited" stores <c>{ before: {...}, after: {...} }</c>),
/// opaque to the schema and decoded by whoever reads it.
/// </para>
/// </summary>
public sealed class ReviewAuditLog : Entity<ReviewAuditLogId>
{
    public ReviewId ReviewId { get; private set; }
    public ReviewAuditAction Action { get; private set; }
    public string ChangesJson { get; private set; } = string.Empty;
    public Guid PerformedByUserId { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }

    private ReviewAuditLog() { }

    public static ReviewAuditLog Record(
        ReviewId reviewId,
        ReviewAuditAction action,
        string changesJson,
        Guid performedByUserId,
        DateTimeOffset occurredAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(changesJson);
        if (performedByUserId == Guid.Empty)
        {
            throw new ArgumentException("PerformedByUserId cannot be empty.", nameof(performedByUserId));
        }

        return new ReviewAuditLog
        {
            Id = ReviewAuditLogId.New(),
            ReviewId = reviewId,
            Action = action,
            ChangesJson = changesJson,
            PerformedByUserId = performedByUserId,
            OccurredAt = occurredAt,
        };
    }
}
