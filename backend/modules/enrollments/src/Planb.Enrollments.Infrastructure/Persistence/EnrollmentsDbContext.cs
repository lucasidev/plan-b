using Microsoft.EntityFrameworkCore;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Enrollments.Infrastructure.Persistence.Configurations;

namespace Planb.Enrollments.Infrastructure.Persistence;

public sealed class EnrollmentsDbContext : DbContext
{
    public const string SchemaName = "enrollments";

    public DbSet<EnrollmentRecord> EnrollmentRecords => Set<EnrollmentRecord>();
    public DbSet<HistorialImport> HistorialImports => Set<HistorialImport>();

    public EnrollmentsDbContext(DbContextOptions<EnrollmentsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new EnrollmentRecordConfiguration());
        modelBuilder.ApplyConfiguration(new HistorialImportConfiguration());
    }
}
