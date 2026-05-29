using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence;

internal sealed class ReviewsUnitOfWork : IReviewsUnitOfWork
{
    private readonly ReviewsDbContext _db;

    public ReviewsUnitOfWork(ReviewsDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
