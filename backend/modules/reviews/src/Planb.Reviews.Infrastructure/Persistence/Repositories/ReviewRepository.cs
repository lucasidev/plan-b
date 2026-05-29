using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class ReviewRepository : IReviewRepository
{
    private readonly ReviewsDbContext _db;

    public ReviewRepository(ReviewsDbContext db) => _db = db;

    public void Add(Review review) => _db.Reviews.Add(review);

    public Task<Review?> FindByIdAsync(ReviewId id, CancellationToken ct = default) =>
        _db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);

    /// <summary>
    /// Idempotency soft del handler de publicar: si ya hay reseña para este enrollment,
    /// el handler devuelve <c>ReviewErrors.AlreadyExistsForEnrollment</c> sin tocar nada.
    /// El UNIQUE index en DB es el cinturón de seguridad para casos de race.
    /// </summary>
    public Task<Review?> FindByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default) =>
        _db.Reviews.FirstOrDefaultAsync(r => r.EnrollmentId == enrollmentId, ct);
}
