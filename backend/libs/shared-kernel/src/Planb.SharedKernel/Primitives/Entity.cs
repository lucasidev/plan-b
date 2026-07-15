using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Clase base para entidades DDD. La identidad es por <see cref="Id"/>, así que dos entidades del
/// mismo tipo con el mismo Id se consideran iguales sin importar su estado en memoria. Los domain
/// events se acumulan a medida que el aggregate muta y se despachan después de persistir (ver
/// SaveChangesInterceptor).
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
