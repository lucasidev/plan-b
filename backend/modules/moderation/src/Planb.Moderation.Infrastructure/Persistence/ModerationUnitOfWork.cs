using Planb.Moderation.Application.Abstractions.Persistence;

namespace Planb.Moderation.Infrastructure.Persistence;

internal sealed class ModerationUnitOfWork : IModerationUnitOfWork
{
    private readonly ModerationDbContext _db;

    public ModerationUnitOfWork(ModerationDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
