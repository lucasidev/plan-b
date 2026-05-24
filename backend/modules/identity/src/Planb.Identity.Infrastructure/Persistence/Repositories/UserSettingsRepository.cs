using Microsoft.EntityFrameworkCore;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Repositories;

internal sealed class UserSettingsRepository : IUserSettingsRepository
{
    private readonly IdentityDbContext _db;

    public UserSettingsRepository(IdentityDbContext db) => _db = db;

    public void Add(UserSettings settings) => _db.UserSettings.Add(settings);

    public Task<UserSettings?> FindByUserIdAsync(UserId userId, CancellationToken ct = default) =>
        _db.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId, ct);
}
