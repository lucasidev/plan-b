using Planb.Planning.Application.Abstractions.Persistence;

namespace Planb.Planning.Infrastructure.Persistence;

internal sealed class PlanningUnitOfWork : IPlanningUnitOfWork
{
    private readonly PlanningDbContext _db;

    public PlanningUnitOfWork(PlanningDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
