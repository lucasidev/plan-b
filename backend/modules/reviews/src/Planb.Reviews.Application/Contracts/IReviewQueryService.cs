namespace Planb.Reviews.Application.Contracts;

/// <summary>
/// Read-side of Reviews exported to other bounded contexts (ADR-0017: cross-BC reads via
/// Contracts, no Postgres FK nor cross-schema EF nav).
///
/// Caller principal: Moderation (US-019). To reject a report where reporter == author it
/// needs the author's user id; only Reviews can resolve a review back to the user who
/// wrote it (review -> enrollment -> student profile -> user). Moderation depends on this
/// contract; Reviews never depends on Moderation, which keeps the assembly graph acyclic.
///
/// Mantener mínimo. Solo agregar métodos cuando un caller real los necesite.
/// </summary>
public interface IReviewQueryService
{
    /// <summary>
    /// Returns the user id of the review's author, or null when the review does not exist
    /// or has been soft-deleted by its author (US-055). A null result maps to 404 at the
    /// Moderation endpoint: you cannot report a review that is gone.
    /// </summary>
    Task<Guid?> GetAuthorUserIdAsync(Guid reviewId, CancellationToken ct = default);
}
