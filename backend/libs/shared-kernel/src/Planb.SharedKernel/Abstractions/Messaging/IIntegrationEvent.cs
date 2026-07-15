namespace Planb.SharedKernel.Abstractions.Messaging;

/// <summary>
/// Marker para eventos que cruzan fronteras de módulo vía el outbox durable de Wolverine.
/// Ver ADR-0014 (modular monolith) y ADR-0015 (Wolverine + outbox).
/// </summary>
public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTimeOffset OccurredAt { get; }
}
