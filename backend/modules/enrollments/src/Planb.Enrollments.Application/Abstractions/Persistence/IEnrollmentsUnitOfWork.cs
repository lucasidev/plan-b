namespace Planb.Enrollments.Application.Abstractions.Persistence;

/// <summary>
/// Unit-of-work boundary del módulo Enrollments. Handlers stagean cambios via los repos y luego
/// flushean explícitamente vía este port. Mismo patrón que <c>IIdentityUnitOfWork</c>.
///
/// Por qué explícito y no <c>[Transactional]</c> de Wolverine: el middleware auto-aplica
/// SaveChanges al final del handler, pero requiere que el DbContext esté integrado al outbox
/// de Wolverine (lo hace el host). Para handlers que solo escriben aggregates locales sin
/// emitir events out, el UoW explícito es más simple y deja el commit visible en el código del
/// handler.
/// </summary>
public interface IEnrollmentsUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
