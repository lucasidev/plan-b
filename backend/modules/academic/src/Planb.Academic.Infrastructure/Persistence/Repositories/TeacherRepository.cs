using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class TeacherRepository : ITeacherRepository
{
    private readonly AcademicDbContext _db;
    public TeacherRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(Teacher teacher, CancellationToken ct = default)
    {
        _db.Teachers.Add(teacher);
        return Task.CompletedTask;
    }

    public Task<Teacher?> GetByIdAsync(TeacherId id, CancellationToken ct = default) =>
        _db.Teachers.FirstOrDefaultAsync(t => t.Id == id, ct);
}
