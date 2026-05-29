using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Infrastructure.Persistence.Configurations;

namespace Planb.Reviews.Infrastructure.Persistence;

public sealed class ReviewsDbContext : DbContext
{
    public const string SchemaName = "reviews";

    public DbSet<Review> Reviews => Set<Review>();

    public ReviewsDbContext(DbContextOptions<ReviewsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.ApplyConfiguration(new ReviewConfiguration());
    }
}
