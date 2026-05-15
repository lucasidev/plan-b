using Planb.Enrollments.Application.Abstractions.Persistence;

namespace Planb.Enrollments.Infrastructure.Persistence;

internal sealed class EnrollmentsUnitOfWork : IEnrollmentsUnitOfWork
{
    private readonly EnrollmentsDbContext _db;

    public EnrollmentsUnitOfWork(EnrollmentsDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
