using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Marker de la raíz de un aggregate DDD. Los repositorios deberían restringir su type parameter
/// a esta interface para que los no-roots no se puedan cargar como unidades sueltas. Hereda de
/// <see cref="IDomainEventSource"/> porque toda raíz de aggregate acumula eventos a medida que muta.
/// </summary>
public interface IAggregateRoot : IDomainEventSource;
