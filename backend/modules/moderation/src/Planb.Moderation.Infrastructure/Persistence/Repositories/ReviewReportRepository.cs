using Microsoft.EntityFrameworkCore;
using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Domain.Reports;

namespace Planb.Moderation.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF-backed repository. The count + exists reads use the same DbContext (and thus the
/// same connection/transaction) as the write, so within a Wolverine [Transactional]
/// handler the open-count sees the just-inserted report before commit. A Dapper read on a
/// fresh connection would not, which is why this stays on EF.
/// </summary>
internal sealed class ReviewReportRepository : IReviewReportRepository
{
    private readonly ModerationDbContext _db;

    public ReviewReportRepository(ModerationDbContext db) => _db = db;

    public void Add(ReviewReport report) => _db.ReviewReports.Add(report);

    public Task<bool> ExistsAsync(Guid reviewId, Guid reporterUserId, CancellationToken ct = default) =>
        _db.ReviewReports.AnyAsync(
            r => r.ReviewId == reviewId && r.ReporterUserId == reporterUserId, ct);

    public Task<int> CountOpenForReviewAsync(Guid reviewId, CancellationToken ct = default) =>
        _db.ReviewReports.CountAsync(
            r => r.ReviewId == reviewId && r.Status == ReviewReportStatus.Open, ct);

    public Task<ReviewReport?> FindByIdAsync(ReviewReportId id, CancellationToken ct = default) =>
        _db.ReviewReports.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<IReadOnlyList<ReviewReport>> GetOpenByReviewAsync(
        Guid reviewId, CancellationToken ct = default) =>
        await _db.ReviewReports
            .Where(r => r.ReviewId == reviewId && r.Status == ReviewReportStatus.Open)
            .ToListAsync(ct);
}
