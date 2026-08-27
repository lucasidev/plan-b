using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class ChairRepository : IChairRepository
{
    private readonly AcademicDbContext _db;
    public ChairRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(Chair chair, CancellationToken ct = default)
    {
        _db.Chairs.Add(chair);
        return Task.CompletedTask;
    }

    public Task<Chair?> GetByIdAsync(ChairId id, CancellationToken ct = default) =>
        _db.Chairs.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> ExistsByNameAsync(
        SubjectId subjectId,
        string name,
        ChairId? excludeId,
        CancellationToken ct = default)
    {
        var query = _db.Chairs.Where(c => c.SubjectId == subjectId && c.Name == name);
        if (excludeId is { } id)
        {
            query = query.Where(c => c.Id != id);
        }

        return query.AnyAsync(ct);
    }

    public async Task<IReadOnlyList<Chair>> GetBySubjectAsync(
        SubjectId subjectId, CancellationToken ct = default) =>
        await _db.Chairs.Where(c => c.SubjectId == subjectId).ToListAsync(ct);
}
