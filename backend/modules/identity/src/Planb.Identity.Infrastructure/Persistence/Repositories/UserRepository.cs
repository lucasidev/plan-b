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

    // Filtramos expired_at IS NULL AND deactivated_at IS NULL en las queries por email porque
    // un email puede tener rows expired (US-022) y/o deactivated (ADR-0044) sobreviviendo en DB
    // para audit, y rows nuevos activos del mismo email. La regla semántica: para
    // "¿este email está en uso?" y "buscame el user con este email", solo contamos los activos
    // (no-expired y no-deactivated). El partial unique index en DB matchea exactamente esta
    // semántica (UNIQUE(email) WHERE expired_at IS NULL AND deactivated_at IS NULL).
    public Task<bool> ExistsByEmailAsync(EmailAddress email, CancellationToken ct = default) =>
        _db.Users.AsNoTracking().AnyAsync(
            u => u.Email == email && u.ExpiredAt == null && u.DeactivatedAt == null, ct);

    public Task<User?> FindByEmailAsync(EmailAddress email, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(
            u => u.Email == email && u.ExpiredAt == null && u.DeactivatedAt == null, ct);

    public Task<User?> FindByIdAsync(UserId id, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<bool> TryUpdateAccessAsync(User user, int expectedAccessVersion, CancellationToken ct = default)
    {
        // La transición se calcula en User. El WHERE evita pisar otra suspensión o escribir
        // sobre una baja ocurrida después de leer, sin cambiar la concurrencia de otros writes.
        var affected = await _db.Users.IgnoreAutoIncludes()
            .Where(u => u.Id == user.Id && u.Role == UserRole.Member
                && u.DeactivatedAt == null && u.ExpiredAt == null && u.AccessVersion == expectedAccessVersion)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.DisabledAt, user.DisabledAt)
                .SetProperty(u => u.DisabledBy, user.DisabledBy)
                .SetProperty(u => u.AccessVersion, user.AccessVersion)
                .SetProperty(u => u.DisabledReason, user.DisabledReason)
                .SetProperty(u => u.UpdatedAt, user.UpdatedAt), ct);
        // ExecuteUpdate ya persistió la transición; el tracker no debe repetirla al cerrar el handler.
        var entry = _db.Entry(user);
        entry.OriginalValues.SetValues(entry.CurrentValues);
        entry.State = EntityState.Unchanged;
        return affected == 1;
    }

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
