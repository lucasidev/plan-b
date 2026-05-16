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
}
