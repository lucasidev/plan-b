using Planb.Academic.Application.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Persistence;

internal sealed class AcademicUnitOfWork : IAcademicUnitOfWork
{
    private readonly AcademicDbContext _db;
    public AcademicUnitOfWork(AcademicDbContext db) => _db = db;
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
