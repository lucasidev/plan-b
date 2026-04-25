using Planb.Identity.Application.Abstractions.Persistence;

namespace Planb.Identity.Infrastructure.Persistence;

internal sealed class IdentityUnitOfWork : IIdentityUnitOfWork
{
    private readonly IdentityDbContext _db;

    public IdentityUnitOfWork(IdentityDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
