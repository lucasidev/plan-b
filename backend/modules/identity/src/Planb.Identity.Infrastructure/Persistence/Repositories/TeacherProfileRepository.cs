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

    // Tracked (el handler muta + persiste). Los tokens vienen por AutoInclude.
    public Task<TeacherProfile?> FindByIdAsync(TeacherProfileId id, CancellationToken ct = default) =>
        _db.TeacherProfiles.FirstOrDefaultAsync(p => p.Id == id, ct);

    public Task<TeacherProfile?> FindByVerificationTokenAsync(
        string rawToken, CancellationToken ct = default) =>
        _db.TeacherProfiles.FirstOrDefaultAsync(
            p => p.Tokens.Any(t =>
                t.Token == rawToken && t.Purpose == TokenPurpose.TeacherInstitutionalVerification),
            ct);

    public Task<bool> AnyVerifiedForTeacherAsync(Guid teacherId, CancellationToken ct = default) =>
        _db.TeacherProfiles.AsNoTracking()
            .AnyAsync(p => p.TeacherId == teacherId && p.VerifiedAt != null, ct);
}
