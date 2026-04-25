using Microsoft.EntityFrameworkCore;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Repositories;

internal sealed class UserRepository : IUserRepository
{
    private readonly IdentityDbContext _db;

    public UserRepository(IdentityDbContext db) => _db = db;

    public void Add(User user) => _db.Users.Add(user);

    public Task<bool> ExistsByEmailAsync(EmailAddress email, CancellationToken ct = default) =>
        _db.Users.AsNoTracking().AnyAsync(u => u.Email == email, ct);

    public Task<User?> FindByIdAsync(UserId id, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
}
