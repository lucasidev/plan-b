using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.CourseReviews;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class CourseReviewRepository : ICourseReviewRepository
{
    private readonly ReviewsDbContext _db;

    public CourseReviewRepository(ReviewsDbContext db) => _db = db;

    public Task AddAsync(CourseReview review, CancellationToken ct = default)
    {
        _db.CourseReviews.Add(review);
        return Task.CompletedTask;
    }

    // Answers viene AutoInclude (ver CourseReviewConfiguration), así que no hace falta un Include acá.
    public Task<CourseReview?> GetByIdAsync(CourseReviewId id, CancellationToken ct = default) =>
        _db.CourseReviews.FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<CourseReview?> GetByCursadaAsync(
        Guid accountId, Guid subjectId, Guid termId, CancellationToken ct = default) =>
        _db.CourseReviews.FirstOrDefaultAsync(
            r => r.AccountId == accountId && r.SubjectId == subjectId && r.TermId == termId, ct);

    public void Remove(CourseReview review) => _db.CourseReviews.Remove(review);
}
