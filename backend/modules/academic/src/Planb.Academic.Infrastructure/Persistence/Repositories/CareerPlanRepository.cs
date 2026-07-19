using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.CareerPlans;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class CareerPlanRepository : ICareerPlanRepository
{
    private readonly AcademicDbContext _db;
    public CareerPlanRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(CareerPlan plan, CancellationToken ct = default)
    {
        _db.CareerPlans.Add(plan);
        return Task.CompletedTask;
    }

    public Task<CareerPlan?> FindByCareerAndYearAsync(
        CareerId careerId, int year, CancellationToken ct = default) =>
        _db.CareerPlans.FirstOrDefaultAsync(
            cp => cp.CareerId == careerId && cp.Year == year, ct);

    public Task<CareerPlan?> FindByIdAsync(CareerPlanId id, CancellationToken ct = default) =>
        _db.CareerPlans.FirstOrDefaultAsync(cp => cp.Id == id, ct);
}
