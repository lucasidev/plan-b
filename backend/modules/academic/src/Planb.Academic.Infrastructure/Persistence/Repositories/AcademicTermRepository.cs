using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class AcademicTermRepository : IAcademicTermRepository
{
    private readonly AcademicDbContext _db;
    public AcademicTermRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(AcademicTerm term, CancellationToken ct = default)
    {
        _db.AcademicTerms.Add(term);
        return Task.CompletedTask;
    }

    public Task<AcademicTerm?> FindByIdAsync(AcademicTermId id, CancellationToken ct = default) =>
        _db.AcademicTerms.FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<bool> ExistsAsync(
        UniversityId universityId,
        int year,
        int number,
        TermKind kind,
        AcademicTermId? excludeId,
        CancellationToken ct = default)
    {
        var query = _db.AcademicTerms.Where(t =>
            t.UniversityId == universityId && t.Year == year && t.Number == number && t.Kind == kind);
        if (excludeId is { } id)
        {
            query = query.Where(t => t.Id != id);
        }

        return query.AnyAsync(ct);
    }
}
