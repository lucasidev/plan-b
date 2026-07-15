using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.SharedKernel.Tests.Primitives;

/// <summary>
/// Tests de Entity&lt;TId&gt;: la identidad es por Id (dos entidades del mismo tipo con el mismo Id son
/// iguales sin importar su estado en memoria), más el buffer de domain events (Raise acumula,
/// ClearDomainEvents drena). Es la base sobre la que se construye todo aggregate del dominio.
/// </summary>
public class EntityTests
{
    [Fact]
    public void Entities_with_the_same_id_are_equal_regardless_of_state()
    {
        var id = Guid.NewGuid();
        var a = new TestEntity(id) { Label = "one" };
        var b = new TestEntity(id) { Label = "another" };

        a.Equals(b).ShouldBeTrue();
        (a == b).ShouldBeTrue();
        (a != b).ShouldBeFalse();
        a.GetHashCode().ShouldBe(b.GetHashCode());
    }

    [Fact]
    public void Entities_with_different_ids_are_not_equal()
    {
        var a = new TestEntity(Guid.NewGuid());
        var b = new TestEntity(Guid.NewGuid());

        a.Equals(b).ShouldBeFalse();
        (a == b).ShouldBeFalse();
        (a != b).ShouldBeTrue();
    }

    [Fact]
    public void An_entity_is_not_equal_to_null()
    {
        var a = new TestEntity(Guid.NewGuid());

        a.Equals(null).ShouldBeFalse();
        (a == null).ShouldBeFalse();
        (null == a).ShouldBeFalse();
    }

    [Fact]
    public void A_new_entity_has_no_domain_events()
    {
        new TestEntity(Guid.NewGuid()).DomainEvents.ShouldBeEmpty();
    }

    [Fact]
    public void Raise_accumulates_events_in_order()
    {
        var entity = new TestEntity(Guid.NewGuid());
        var first = new TestEvent(DateTimeOffset.UnixEpoch);
        var second = new TestEvent(DateTimeOffset.UnixEpoch.AddMinutes(1));

        entity.RaiseEvent(first);
        entity.RaiseEvent(second);

        entity.DomainEvents.ShouldBe([first, second]);
    }

    [Fact]
    public void ClearDomainEvents_drains_the_buffer()
    {
        var entity = new TestEntity(Guid.NewGuid());
        entity.RaiseEvent(new TestEvent(DateTimeOffset.UnixEpoch));

        entity.ClearDomainEvents();

        entity.DomainEvents.ShouldBeEmpty();
    }
}

file sealed class TestEntity(Guid id) : Entity<Guid>(id)
{
    public string Label { get; init; } = string.Empty;

    public void RaiseEvent(IDomainEvent @event) => Raise(@event);
}

file sealed record TestEvent(DateTimeOffset OccurredAt) : IDomainEvent;
