using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Base class for DDD entities. Identity is by <see cref="Id"/>, so two entities of the same
/// type with the same Id are considered equal regardless of in-memory state. Domain events are
/// collected as the aggregate mutates and dispatched after persistence (see SaveChangesInterceptor).
/// </summary>
public abstract class Entity<TId> : IDomainEventSource, IEquatable<Entity<TId>>
    where TId : notnull
{
    public TId Id { get; protected set; } = default!;

    private readonly List<IDomainEvent> _domainEvents = [];
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents;

    protected Entity() { }

    protected Entity(TId id) => Id = id;

    protected void Raise(IDomainEvent @event) => _domainEvents.Add(@event);

    public void ClearDomainEvents() => _domainEvents.Clear();

    public bool Equals(Entity<TId>? other) =>
        other is not null && EqualityComparer<TId>.Default.Equals(Id, other.Id);

    public override bool Equals(object? obj) => obj is Entity<TId> e && Equals(e);

    public override int GetHashCode() => Id.GetHashCode();

    public static bool operator ==(Entity<TId>? a, Entity<TId>? b) =>
        a is null ? b is null : a.Equals(b);

    public static bool operator !=(Entity<TId>? a, Entity<TId>? b) => !(a == b);
}
