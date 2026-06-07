using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Append-only repository for <see cref="ReviewAuditLog"/>. Reads are not exposed here:
/// integration tests + moderation features that need the trail go through Dapper query
/// services, keeping this abstraction focused on writes.
///
/// <see cref="CountByActionSinceAsync"/> is the cooldown helper used by US-018 to enforce
/// 5 edits per 24h. It counts entries by action so a "deleted" or "reported" entry on the
/// same review does not consume the edit budget.
/// </summary>
public interface IReviewAuditLogRepository
{
    void Add(ReviewAuditLog entry);

    Task<int> CountByActionSinceAsync(
        ReviewId reviewId,
        ReviewAuditAction action,
        DateTimeOffset since,
        CancellationToken ct = default);
}
