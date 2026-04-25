using Planb.SharedKernel.Abstractions.DomainEvents;
using Wolverine;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Adapter from <see cref="IDomainEventPublisher"/> to Wolverine's <see cref="IMessageBus"/>.
/// Lives in the host because it's the only place that knows about the concrete bus impl.
/// </summary>
public sealed class WolverineDomainEventPublisher : IDomainEventPublisher
{
    private readonly IMessageBus _bus;

    public WolverineDomainEventPublisher(IMessageBus bus) => _bus = bus;

    public Task PublishAsync(IDomainEvent @event, CancellationToken ct = default) =>
        _bus.PublishAsync(@event).AsTask();
}
