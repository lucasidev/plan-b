using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.CourseReviews;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Votes;
using Planb.Reviews.Infrastructure.Persistence.Configurations;

namespace Planb.Reviews.Infrastructure.Persistence;

public sealed class ReviewsDbContext : DbContext
{
    public const string SchemaName = "reviews";

    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ReviewAuditLog> AuditLog => Set<ReviewAuditLog>();
    public DbSet<ReviewVote> ReviewVotes => Set<ReviewVote>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Instrument> Instruments => Set<Instrument>();
    public DbSet<CourseReview> CourseReviews => Set<CourseReview>();

    public ReviewsDbContext(DbContextOptions<ReviewsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new ReviewConfiguration());
        modelBuilder.ApplyConfiguration(new ReviewAuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new ReviewVoteConfiguration());
        modelBuilder.ApplyConfiguration(new ItemConfiguration());
        modelBuilder.ApplyConfiguration(new InstrumentConfiguration());
        modelBuilder.ApplyConfiguration(new CourseReviewConfiguration());
    }
}
