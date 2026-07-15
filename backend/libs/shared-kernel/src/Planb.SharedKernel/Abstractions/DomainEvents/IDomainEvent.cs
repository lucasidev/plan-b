namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Marker para eventos in-process que las entidades levantan cuando su estado transiciona.
/// Los domain events se despachan dentro del mismo bounded context (ej. actualizar un read model
/// local). La propagación cross-context usa <see cref="Messaging.IIntegrationEvent"/> vía el outbox
/// de Wolverine; un domain handler puentea los dos cuando hace falta.
/// </summary>
public interface IDomainEvent
{
    DateTimeOffset OccurredAt { get; }
}
