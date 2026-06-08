namespace Planb.Moderation.Application.Abstractions.Persistence;

/// <summary>
/// Unit-of-work boundary for the Moderation module. Same pattern as the other modules:
/// handlers stage changes via repositories and commit through this port. Wolverine's
/// [Transactional] middleware auto-commits, but the explicit port keeps handlers testable
/// without Wolverine.
/// </summary>
public interface IModerationUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
