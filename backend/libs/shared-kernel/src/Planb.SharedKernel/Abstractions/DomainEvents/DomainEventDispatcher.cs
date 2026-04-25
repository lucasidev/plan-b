using Planb.SharedKernel.Primitives;

namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Walks the supplied aggregate roots, publishes their queued domain events through
/// <see cref="IDomainEventPublisher"/>, and clears the per-aggregate event lists.
///
/// Call this from a command handler before returning, while still inside the Wolverine
/// <c>[Transactional]</c> middleware. The Wolverine outbox enrolls each publish in the same
/// transaction as the EF SaveChanges, so events become durable atomically with the aggregate
/// state that produced them.
/// </summary>
public static class DomainEventDispatcher
{
    public static async Task DispatchAsync(
        IEnumerable<IAggregateRoot> aggregates,
        IDomainEventPublisher publisher,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(aggregates);
        ArgumentNullException.ThrowIfNull(publisher);

        var roots = aggregates.ToList();
        var events = roots.SelectMany(r => r.DomainEvents).ToList();

        foreach (var root in roots)
        {
            root.ClearDomainEvents();
        }

        foreach (var @event in events)
        {
            await publisher.PublishAsync(@event, ct);
        }
    }
}
