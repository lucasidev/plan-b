namespace Planb.Academic.Domain.CareerPlanImports;

/// <summary>
/// Repo mínimo del aggregate. <c>FindByIdForOwnerAsync</c> garantiza que un alumno solo accede
/// a sus propios imports (no leakeamos imports de otros).
/// </summary>
public interface ICareerPlanImportRepository
{
    Task AddAsync(CareerPlanImport import, CancellationToken ct = default);

    Task<CareerPlanImport?> FindByIdAsync(CareerPlanImportId id, CancellationToken ct = default);

    Task<CareerPlanImport?> FindByIdForOwnerAsync(
        CareerPlanImportId id, Guid uploadedByUserId, CancellationToken ct = default);
}
