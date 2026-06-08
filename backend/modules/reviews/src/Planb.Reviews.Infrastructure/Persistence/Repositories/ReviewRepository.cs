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
    /// Idempotency soft del handler de publicar: si ya hay reseña viva para este enrollment,
    /// el handler devuelve <c>ReviewErrors.AlreadyExistsForEnrollment</c> sin tocar nada.
    /// El UNIQUE index parcial en DB es el cinturón de seguridad para casos de race.
    ///
    /// Excluye reseñas soft-deleted (US-055): si el autor borró su reseña, la cursada
    /// reaparece en Pendientes y puede reseñarla de nuevo. Una review <c>Deleted</c> no
    /// bloquea la creación de una nueva para el mismo enrollment.
    /// </summary>
    public Task<Review?> FindByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default) =>
        _db.Reviews.FirstOrDefaultAsync(
            r => r.EnrollmentId == enrollmentId && r.Status != ReviewStatus.Deleted, ct);
}
