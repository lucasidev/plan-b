using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Infrastructure.Persistence.Configurations;

namespace Planb.Reviews.Infrastructure.Persistence;

public sealed class ReviewsDbContext : DbContext
{
    public const string SchemaName = "reviews";

    public DbSet<Item> Items => Set<Item>();
    public DbSet<Instrument> Instruments => Set<Instrument>();
    public DbSet<Review> Reviews => Set<Review>();

    public ReviewsDbContext(DbContextOptions<ReviewsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new ItemConfiguration());
        modelBuilder.ApplyConfiguration(new InstrumentConfiguration());
        modelBuilder.ApplyConfiguration(new ReviewConfiguration());
    }
}
