namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Marker for the root of a DDD aggregate. Repositories should constrain their type parameter
/// to this interface so non-roots can't be loaded as standalone units.
/// </summary>
public interface IAggregateRoot;
