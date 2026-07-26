namespace Planb.Planning.Application.Abstractions.Persistence;

/// <summary>
/// Unit-of-work boundary del módulo Planning (US-023). Mismo patrón que IModerationUnitOfWork /
/// IAcademicUnitOfWork: los handlers stagean cambios vía repositorios y commitean acá. Wolverine's
/// [Transactional] middleware autocommitea, pero el puerto explícito deja los handlers testeables
/// sin Wolverine.
/// </summary>
public interface IPlanningUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
