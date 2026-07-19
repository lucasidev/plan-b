using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class CareerRepository : ICareerRepository
{
    private readonly AcademicDbContext _db;
    public CareerRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(Career career, CancellationToken ct = default)
    {
        _db.Careers.Add(career);
        return Task.CompletedTask;
    }

    public Task<Career?> FindByUniversityAndSlugAsync(
        UniversityId universityId, string slug, CancellationToken ct = default) =>
        _db.Careers.FirstOrDefaultAsync(
            c => c.UniversityId == universityId && c.Slug == slug, ct);

    public Task<Career?> FindByIdAsync(CareerId id, CancellationToken ct = default) =>
        _db.Careers.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> ExistsBySlugAsync(
        UniversityId universityId, string slug, CareerId? excludeId, CancellationToken ct = default)
    {
        var query = _db.Careers.Where(c => c.UniversityId == universityId && c.Slug == slug);
        if (excludeId is { } id)
        {
            query = query.Where(c => c.Id != id);
        }

        return query.AnyAsync(ct);
    }

    public Task<bool> ExistsByCodeAsync(
        UniversityId universityId, string code, CareerId? excludeId, CancellationToken ct = default)
    {
        var query = _db.Careers.Where(c => c.UniversityId == universityId && c.Code == code);
        if (excludeId is { } id)
        {
            query = query.Where(c => c.Id != id);
        }

        return query.AnyAsync(ct);
    }
}
