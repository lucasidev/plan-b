using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class CareerPlanImportRepository : ICareerPlanImportRepository
{
    private readonly AcademicDbContext _db;

    public CareerPlanImportRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(CareerPlanImport import, CancellationToken ct = default)
    {
        _db.CareerPlanImports.Add(import);
        return Task.CompletedTask;
    }

    public Task<CareerPlanImport?> FindByIdAsync(
        CareerPlanImportId id, CancellationToken ct = default) =>
        _db.CareerPlanImports.FirstOrDefaultAsync(i => i.Id == id, ct);

    public Task<CareerPlanImport?> FindByIdForOwnerAsync(
        CareerPlanImportId id, Guid uploadedByUserId, CancellationToken ct = default) =>
        _db.CareerPlanImports
            .FirstOrDefaultAsync(
                i => i.Id == id && i.UploadedByUserId == uploadedByUserId,
                ct);
}
