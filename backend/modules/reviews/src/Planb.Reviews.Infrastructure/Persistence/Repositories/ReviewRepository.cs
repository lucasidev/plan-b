using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class ReviewRepository : IReviewRepository
{
    private readonly ReviewsDbContext _db;

    public ReviewRepository(ReviewsDbContext db) => _db = db;

    public Task AddAsync(Review review, CancellationToken ct = default)
    {
        _db.Reviews.Add(review);
        return Task.CompletedTask;
    }

    // Answers viene AutoInclude (ver ReviewConfiguration), así que no hace falta un Include acá.
    public Task<Review?> GetByIdAsync(ReviewId id, CancellationToken ct = default) =>
        _db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<Review?> GetByCursadaAsync(
        Guid accountId, Guid subjectId, Guid termId, CancellationToken ct = default) =>
        _db.Reviews.FirstOrDefaultAsync(
            r => r.AccountId == accountId && r.SubjectId == subjectId && r.TermId == termId, ct);

    public void Remove(Review review) => _db.Reviews.Remove(review);
}
