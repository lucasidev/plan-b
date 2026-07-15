namespace Planb.SharedKernel.Abstractions.DomainEvents;

/// <summary>
/// Cualquier cosa que acumula instancias de <see cref="IDomainEvent"/> durante sus mutaciones de
/// estado y se puede drenar una vez despachadas. Lo implementa <c>Entity&lt;TId&gt;</c>.
/// </summary>
public interface IDomainEventSource
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}
