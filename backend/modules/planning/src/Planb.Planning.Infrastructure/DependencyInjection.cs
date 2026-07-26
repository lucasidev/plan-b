using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Drafts;
using Planb.Planning.Infrastructure.Persistence;
using Planb.Planning.Infrastructure.Persistence.Queries;
using Planb.Planning.Infrastructure.Persistence.Repositories;

namespace Planb.Planning.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires los adapters de infrastructure de Planning. El <see cref="PlanningDbContext"/> (US-023,
    /// primera escritura del módulo) lo registra el host con
    /// <c>AddDbContextWithWolverineIntegration</c>, mismo patrón que Moderation.
    /// </summary>
    public static IServiceCollection AddPlanningInfrastructure(this IServiceCollection services)
    {
        // US-016: read sides Dapper cross-schema: el snapshot de disponibilidad (available) y las
        // métricas de evaluate (dificultad ponderada + cohorte).
        services.AddScoped<ISimulatorAvailabilityReader, DapperSimulatorAvailabilityReader>();
        services.AddScoped<ISimulatorEvaluationReader, DapperSimulatorEvaluationReader>();

        // US-023: primera escritura de Planning (antes solo lectura, ADR-0029).
        services.AddScoped<IPlanningUnitOfWork, PlanningUnitOfWork>();
        services.AddScoped<ISimulationDraftRepository, SimulationDraftRepository>();
        services.AddScoped<ISimulationDraftListReader, DapperSimulationDraftListReader>();

        return services;
    }

    /// <summary>
    /// Configures <see cref="PlanningDbContext"/> options. El host invoca esto desde
    /// <c>AddDbContextWithWolverineIntegration</c> para co-administrar transacciones.
    /// </summary>
    public static void ConfigurePlanningDbContext(
        DbContextOptionsBuilder builder, string connectionString)
    {
        builder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable(
                tableName: "__ef_migrations_history",
                schema: PlanningDbContext.SchemaName);
        });
    }
}
