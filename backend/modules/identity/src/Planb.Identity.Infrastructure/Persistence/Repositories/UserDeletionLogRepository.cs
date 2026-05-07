using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Repositories;

internal sealed class UserDeletionLogRepository : IUserDeletionLogRepository
{
    private readonly IdentityDbContext _db;

    public UserDeletionLogRepository(IdentityDbContext db) => _db = db;

    public void Add(UserDeletionLog log) => _db.UserDeletionLogs.Add(log);
}
