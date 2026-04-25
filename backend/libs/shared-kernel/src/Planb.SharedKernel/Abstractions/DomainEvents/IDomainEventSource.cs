namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Anything that accumulates <see cref="IDomainEvent"/> instances during state mutations and
/// can be drained once they've been dispatched. Implemented by <c>Entity&lt;TId&gt;</c>.
/// </summary>
public interface IDomainEventSource
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}
