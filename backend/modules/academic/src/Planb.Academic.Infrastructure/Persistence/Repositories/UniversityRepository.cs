using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class UniversityRepository : IUniversityRepository
{
    private readonly AcademicDbContext _db;
    public UniversityRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(University university, CancellationToken ct = default)
    {
        _db.Universities.Add(university);
        return Task.CompletedTask;
    }

    public Task<University?> FindByIdAsync(UniversityId id, CancellationToken ct = default) =>
        _db.Universities.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> ExistsBySlugAsync(
        string slug, UniversityId? excludeId, CancellationToken ct = default)
    {
        var query = _db.Universities.Where(u => u.Slug == slug);
        if (excludeId is { } id)
        {
            query = query.Where(u => u.Id != id);
        }

        return query.AnyAsync(ct);
    }
}
