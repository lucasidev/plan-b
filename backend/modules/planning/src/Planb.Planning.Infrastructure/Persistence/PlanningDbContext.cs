using Microsoft.EntityFrameworkCore;
using Planb.Planning.Domain.Drafts;
using Planb.Planning.Infrastructure.Persistence.Configurations;

namespace Planb.Planning.Infrastructure.Persistence;

/// <summary>
/// DbContext del módulo Planning (US-023), schema <c>planning</c>. Primer DbContext del módulo:
/// hasta acá Planning era 100% lectura (Dapper cross-schema, sin escritura propia, ADR-0029).
/// </summary>
public sealed class PlanningDbContext : DbContext
{
    public const string SchemaName = "planning";

    public DbSet<SimulationDraft> SimulationDrafts => Set<SimulationDraft>();

    public PlanningDbContext(DbContextOptions<PlanningDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfiguration(new SimulationDraftConfiguration());
    }
}
