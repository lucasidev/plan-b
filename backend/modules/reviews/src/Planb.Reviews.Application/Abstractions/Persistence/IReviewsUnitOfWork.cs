namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Unit-of-work boundary del módulo Reviews. Los handlers stagear cambios via repositories y
/// commitean via este port; la implementación flushea el EF DbContext subyacente. Wolverine
/// con el middleware <c>[Transactional]</c> commitea automático, pero el port queda explícito
/// para tests unitarios sin Wolverine.
/// </summary>
public interface IReviewsUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
