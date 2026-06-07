using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class ReviewAuditLogRepository : IReviewAuditLogRepository
{
    private readonly ReviewsDbContext _db;

    public ReviewAuditLogRepository(ReviewsDbContext db) => _db = db;

    public void Add(ReviewAuditLog entry) => _db.AuditLog.Add(entry);

    public Task<int> CountByActionSinceAsync(
        ReviewId reviewId,
        ReviewAuditAction action,
        DateTimeOffset since,
        CancellationToken ct = default) =>
        _db.AuditLog
            .Where(e => e.ReviewId == reviewId
                     && e.Action == action
                     && e.OccurredAt >= since)
            .CountAsync(ct);
}
