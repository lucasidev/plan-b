namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Marker for in-process events raised by aggregates when their state transitions.
/// Domain events are dispatched within the same bounded context (e.g. updating a local read
/// model). Cross-context propagation uses <see cref="Messaging.IIntegrationEvent"/> via Wolverine
/// outbox; a domain handler bridges the two when needed.
/// </summary>
public interface IDomainEvent
{
    DateTimeOffset OccurredAt { get; }
}
