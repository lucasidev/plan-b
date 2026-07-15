using Planb.SharedKernel.Primitives;

namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Recorre los aggregate roots que recibe, publica sus domain events encolados a través de
/// <see cref="IDomainEventPublisher"/>, y limpia las listas de eventos por aggregate.
///
/// Se llama desde un command handler antes de devolver, todavía dentro del middleware
/// <c>[Transactional]</c> de Wolverine. El outbox de Wolverine inscribe cada publish en la misma
/// transacción que el SaveChanges de EF, así los eventos se vuelven durables atómicamente con el
/// estado del aggregate que los produjo.
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
