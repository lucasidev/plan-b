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
}
