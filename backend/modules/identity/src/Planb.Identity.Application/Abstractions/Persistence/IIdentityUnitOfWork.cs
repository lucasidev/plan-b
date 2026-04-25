namespace Planb.Identity.Application.Abstractions.Persistence;

/// <summary>
/// Unit-of-work boundary for the Identity module. Handlers stage changes via the repositories
/// and then commit via this port; the implementation flushes the underlying EF DbContext.
/// </summary>
public interface IIdentityUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
