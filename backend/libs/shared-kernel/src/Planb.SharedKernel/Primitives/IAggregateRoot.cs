using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Marker for the root of a DDD aggregate. Repositories should constrain their type parameter
/// to this interface so non-roots can't be loaded as standalone units. Inherits from
/// <see cref="IDomainEventSource"/> because every aggregate root accumulates events as it mutates.
/// </summary>
public interface IAggregateRoot : IDomainEventSource;
