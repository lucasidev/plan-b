using Microsoft.EntityFrameworkCore;
using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Infrastructure.Persistence.Repositories;

internal sealed class HistorialImportRepository : IHistorialImportRepository
{
    private readonly EnrollmentsDbContext _db;

    public HistorialImportRepository(EnrollmentsDbContext db) => _db = db;

    public Task AddAsync(HistorialImport import, CancellationToken ct = default)
    {
        _db.HistorialImports.Add(import);
        return Task.CompletedTask;
    }

    public Task<HistorialImport?> FindByIdAsync(
        HistorialImportId id, CancellationToken ct = default) =>
        _db.HistorialImports.FirstOrDefaultAsync(i => i.Id == id, ct);

    public Task<HistorialImport?> FindByIdForOwnerAsync(
        HistorialImportId id, Guid studentProfileId, CancellationToken ct = default) =>
        _db.HistorialImports
            .FirstOrDefaultAsync(
                i => i.Id == id && i.StudentProfileId == studentProfileId,
                ct);
}
