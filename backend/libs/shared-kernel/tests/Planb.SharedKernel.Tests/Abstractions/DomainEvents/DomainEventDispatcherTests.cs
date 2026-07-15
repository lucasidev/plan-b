using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.SharedKernel.Tests.Abstractions.DomainEvents;

/// <summary>
/// Tests de DomainEventDispatcher: toma un snapshot de los eventos de cada aggregate, drena sus buffers,
/// y publica cada uno a través de IDomainEventPublisher. Un handler lo llama antes de devolver, dentro
/// del middleware [Transactional] de Wolverine, así los eventos se vuelven durables atómicamente con el
/// estado del aggregate.
/// </summary>
public class DomainEventDispatcherTests
{
    [Fact]
    public async Task Publishes_every_event_from_every_aggregate_and_drains_them()
    {
        var a = new TestAggregate();
        var b = new TestAggregate();
        var e1 = new TestEvent(DateTimeOffset.UnixEpoch);
        var e2 = new TestEvent(DateTimeOffset.UnixEpoch.AddMinutes(1));
        var e3 = new TestEvent(DateTimeOffset.UnixEpoch.AddMinutes(2));
        a.RaiseEvent(e1);
        a.RaiseEvent(e2);
        b.RaiseEvent(e3);
        var publisher = new RecordingPublisher();

        await DomainEventDispatcher.DispatchAsync([a, b], publisher);

        publisher.Published.ShouldBe([e1, e2, e3]);
        a.DomainEvents.ShouldBeEmpty();
        b.DomainEvents.ShouldBeEmpty();
    }

    [Fact]
    public async Task Aggregates_without_events_produce_no_publishes()
    {
        var publisher = new RecordingPublisher();

        await DomainEventDispatcher.DispatchAsync([new TestAggregate()], publisher);

        publisher.Published.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_empty_aggregate_set_is_a_no_op()
    {
        var publisher = new RecordingPublisher();

        await DomainEventDispatcher.DispatchAsync(Array.Empty<IAggregateRoot>(), publisher);

        publisher.Published.ShouldBeEmpty();
    }

    [Fact]
    public async Task Null_aggregates_throws()
    {
        await Should.ThrowAsync<ArgumentNullException>(() =>
            DomainEventDispatcher.DispatchAsync(null!, new RecordingPublisher()));
    }

    [Fact]
    public async Task Null_publisher_throws()
    {
        await Should.ThrowAsync<ArgumentNullException>(() =>
            DomainEventDispatcher.DispatchAsync([new TestAggregate()], null!));
    }
}

file sealed class TestAggregate() : Entity<Guid>(Guid.NewGuid()), IAggregateRoot
{
    public void RaiseEvent(IDomainEvent @event) => Raise(@event);
}

file sealed record TestEvent(DateTimeOffset OccurredAt) : IDomainEvent;

file sealed class RecordingPublisher : IDomainEventPublisher
{
    public List<IDomainEvent> Published { get; } = [];

    public Task PublishAsync(IDomainEvent @event, CancellationToken ct = default)
    {
        Published.Add(@event);
        return Task.CompletedTask;
    }
}
