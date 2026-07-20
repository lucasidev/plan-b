using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class SubjectRepository : ISubjectRepository
{
    private readonly AcademicDbContext _db;
    public SubjectRepository(AcademicDbContext db) => _db = db;

    public Task AddRangeAsync(IEnumerable<Subject> subjects, CancellationToken ct = default)
    {
        _db.Subjects.AddRange(subjects);
        return Task.CompletedTask;
    }

    public Task AddAsync(Subject subject, CancellationToken ct = default)
    {
        _db.Subjects.Add(subject);
        return Task.CompletedTask;
    }

    public Task<Subject?> GetByIdAsync(SubjectId id, CancellationToken ct = default) =>
        _db.Subjects.FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<bool> ExistsByCodeAsync(
        CareerPlanId careerPlanId, string code, SubjectId? excludeId, CancellationToken ct = default)
    {
        var query = _db.Subjects.Where(s => s.CareerPlanId == careerPlanId && s.Code == code);
        if (excludeId is { } id)
        {
            query = query.Where(s => s.Id != id);
        }

        return query.AnyAsync(ct);
    }
}
