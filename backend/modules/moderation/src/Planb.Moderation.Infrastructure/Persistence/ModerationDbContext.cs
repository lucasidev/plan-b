using Microsoft.EntityFrameworkCore;
using Planb.Moderation.Domain.Reports;
using Planb.Moderation.Infrastructure.Persistence.Configurations;

namespace Planb.Moderation.Infrastructure.Persistence;

public sealed class ModerationDbContext : DbContext
{
    public const string SchemaName = "moderation";

    public DbSet<ReviewReport> ReviewReports => Set<ReviewReport>();

    public ModerationDbContext(DbContextOptions<ModerationDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new ReviewReportConfiguration());
    }
}
