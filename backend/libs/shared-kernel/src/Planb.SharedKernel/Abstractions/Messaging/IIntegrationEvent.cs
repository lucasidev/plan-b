namespace Planb.SharedKernel.Abstractions.Messaging;

/// <summary>
/// Marker for events that cross module boundaries via Wolverine's durable outbox.
/// See ADR-0014 (modular monolith) and ADR-0015 (Wolverine + outbox).
/// </summary>
public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTimeOffset OccurredAt { get; }
}
