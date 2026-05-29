using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Abstractions.Persistence;

public interface IReviewRepository
{
    void Add(Review review);

    Task<Review?> FindByIdAsync(ReviewId id, CancellationToken ct = default);

    /// <summary>
    /// US-017: una sola Review por EnrollmentRecord (constraint UNIQUE en data-model).
    /// El handler de publish chequea esto antes de invocar el factory para responder con
    /// idempotency (devolver la review existente con 200) en lugar de 409 cuando el client
    /// reintenta.
    /// </summary>
    Task<Review?> FindByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default);
}
