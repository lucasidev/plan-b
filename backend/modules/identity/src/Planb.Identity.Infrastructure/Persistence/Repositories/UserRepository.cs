using Microsoft.EntityFrameworkCore;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Repositories;

internal sealed class UserRepository : IUserRepository
{
    private readonly IdentityDbContext _db;

    public UserRepository(IdentityDbContext db) => _db = db;

    public void Add(User user) => _db.Users.Add(user);

    public void Remove(User user) => _db.Users.Remove(user);

    // Filtramos expired_at IS NULL en las queries por email porque, post-US-022, un email puede
    // tener un row expired (sobreviviendo en la DB para audit) y un row nuevo activo. La regla
    // semántica: para "¿este email está en uso?" y "buscame el user con este email", solo
    // contamos los activos (no-expired). El partial unique index en DB matchea exactamente
    // esta semántica (UNIQUE(email) WHERE expired_at IS NULL).
    public Task<bool> ExistsByEmailAsync(EmailAddress email, CancellationToken ct = default) =>
        _db.Users.AsNoTracking().AnyAsync(u => u.Email == email && u.ExpiredAt == null, ct);

    public Task<User?> FindByEmailAsync(EmailAddress email, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == email && u.ExpiredAt == null, ct);

    public Task<User?> FindByIdAsync(UserId id, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> FindByVerificationTokenAsync(
        string rawToken,
        TokenPurpose purpose,
        CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(
            u => u.Tokens.Any(t => t.Token == rawToken && t.Purpose == purpose),
            ct);

    public Task<User?> FindByRawVerificationTokenAsync(
        string rawToken,
        CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(
            u => u.Tokens.Any(t => t.Token == rawToken),
            ct);
}
