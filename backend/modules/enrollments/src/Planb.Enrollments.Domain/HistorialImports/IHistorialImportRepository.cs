namespace Planb.Enrollments.Domain.HistorialImports;

/// <summary>
/// Repo del aggregate. Mantiene la interface mínima del MVP:
/// <list type="bullet">
///   <item><c>AddAsync</c> para el endpoint POST.</item>
///   <item><c>FindByIdAsync</c> para el worker (que carga el aggregate, transiciona, persiste)
///         y para el endpoint GET status.</item>
///   <item><c>FindByIdForOwnerAsync</c> para los endpoints autenticados que también validan
///         ownership (no leakeamos imports de otros users).</item>
/// </list>
/// El read del list ("mis últimos imports") queda para post-MVP si aparece el caller real.
/// </summary>
public interface IHistorialImportRepository
{
    Task AddAsync(HistorialImport import, CancellationToken ct = default);

    Task<HistorialImport?> FindByIdAsync(HistorialImportId id, CancellationToken ct = default);

    Task<HistorialImport?> FindByIdForOwnerAsync(
        HistorialImportId id, Guid studentProfileId, CancellationToken ct = default);
}
