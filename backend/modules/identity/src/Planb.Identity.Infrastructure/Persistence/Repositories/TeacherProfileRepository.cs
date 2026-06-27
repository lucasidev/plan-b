using Microsoft.EntityFrameworkCore;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Repositories;

internal sealed class TeacherProfileRepository : ITeacherProfileRepository
{
    private readonly IdentityDbContext _db;

    public TeacherProfileRepository(IdentityDbContext db) => _db = db;

    public void Add(TeacherProfile profile) => _db.TeacherProfiles.Add(profile);

    public Task<bool> ExistsForUserAndTeacherAsync(
        UserId userId, Guid teacherId, CancellationToken ct = default) =>
        _db.TeacherProfiles.AsNoTracking()
            .AnyAsync(p => p.UserId == userId && p.TeacherId == teacherId, ct);
}
