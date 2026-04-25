namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Port for publishing domain events to the messaging infrastructure (Wolverine in this app).
/// Keeps the shared kernel and module application layers free of any specific bus dependency.
/// </summary>
public interface IDomainEventPublisher
{
    Task PublishAsync(IDomainEvent @event, CancellationToken ct = default);
}
