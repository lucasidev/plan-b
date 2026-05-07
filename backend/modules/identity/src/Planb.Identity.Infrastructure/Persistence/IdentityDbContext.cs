using Microsoft.EntityFrameworkCore;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence.Configurations;

namespace Planb.Identity.Infrastructure.Persistence;

public sealed class IdentityDbContext : DbContext
{
    public const string SchemaName = "identity";

    public DbSet<User> Users => Set<User>();

    public DbSet<UserDeletionLog> UserDeletionLogs => Set<UserDeletionLog>();

    public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserDeletionLogConfiguration());
    }
}
