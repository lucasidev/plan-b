using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.Commissions;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class CommissionRepository : ICommissionRepository
{
    private readonly AcademicDbContext _db;
    public CommissionRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(Commission commission, CancellationToken ct = default)
    {
        _db.Commissions.Add(commission);
        return Task.CompletedTask;
    }

    public Task<Commission?> GetByIdAsync(CommissionId id, CancellationToken ct = default) =>
        _db.Commissions.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> ExistsByNameAsync(
        Guid subjectId,
        Guid termId,
        string name,
        CommissionId? excludeId,
        CancellationToken ct = default)
    {
        var query = _db.Commissions.Where(
            c => c.SubjectId == subjectId && c.TermId == termId && c.Name == name);
        if (excludeId is { } id)
        {
            query = query.Where(c => c.Id != id);
        }

        return query.AnyAsync(ct);
    }

    public Task<bool> ExistsForTermAsync(Guid termId, CancellationToken ct = default) =>
        _db.Commissions.AnyAsync(c => c.TermId == termId, ct);

    public Task<bool> ExistsForSubjectAsync(Guid subjectId, CancellationToken ct = default) =>
        _db.Commissions.AnyAsync(c => c.SubjectId == subjectId, ct);
}
