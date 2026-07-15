namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Port para publicar domain events a la infraestructura de mensajería (Wolverine en esta app).
/// Mantiene el shared kernel y las capas de aplicación de los módulos libres de cualquier
/// dependencia específica del bus.
/// </summary>
public interface IDomainEventPublisher
{
    Task PublishAsync(IDomainEvent @event, CancellationToken ct = default);
}
