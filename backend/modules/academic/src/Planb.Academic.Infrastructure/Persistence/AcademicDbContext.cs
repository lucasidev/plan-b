using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence.Configurations;

namespace Planb.Academic.Infrastructure.Persistence;

public sealed class AcademicDbContext : DbContext
{
    public const string SchemaName = "academic";

    public DbSet<University> Universities => Set<University>();
    public DbSet<Career> Careers => Set<Career>();
    public DbSet<CareerPlan> CareerPlans => Set<CareerPlan>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<AcademicTerm> AcademicTerms => Set<AcademicTerm>();

    public AcademicDbContext(DbContextOptions<AcademicDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new UniversityConfiguration());
        modelBuilder.ApplyConfiguration(new CareerConfiguration());
        modelBuilder.ApplyConfiguration(new CareerPlanConfiguration());
        modelBuilder.ApplyConfiguration(new SubjectConfiguration());
        modelBuilder.ApplyConfiguration(new AcademicTermConfiguration());
    }
}
