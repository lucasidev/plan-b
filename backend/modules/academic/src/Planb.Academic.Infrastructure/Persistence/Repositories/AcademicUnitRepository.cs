using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class AcademicUnitRepository : IAcademicUnitRepository
{
    private readonly AcademicDbContext _db;
    public AcademicUnitRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(AcademicUnit academicUnit, CancellationToken ct = default)
    {
        _db.AcademicUnits.Add(academicUnit);
        return Task.CompletedTask;
    }

    public Task<AcademicUnit?> FindByIdAsync(AcademicUnitId id, CancellationToken ct = default) =>
        _db.AcademicUnits.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> ExistsBySlugAsync(
        UniversityId universityId, string slug, AcademicUnitId? excludeId, CancellationToken ct = default)
    {
        var query = _db.AcademicUnits.Where(u => u.UniversityId == universityId && u.Slug == slug);
        if (excludeId is { } id)
        {
            query = query.Where(u => u.Id != id);
        }

        return query.AnyAsync(ct);
    }
}
