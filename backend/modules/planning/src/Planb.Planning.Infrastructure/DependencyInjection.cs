using Microsoft.Extensions.DependencyInjection;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Infrastructure.Persistence.Queries;

namespace Planb.Planning.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPlanningInfrastructure(this IServiceCollection services)
    {
        // US-016: sin DbContext ni repositorio EF todavía (ADR-0029, sin persistencia hasta
        // US-023). Los read sides son ambos Dapper cross-schema: el snapshot de disponibilidad
        // (available) y las métricas de evaluate (dificultad ponderada + cohorte).
        services.AddScoped<ISimulatorAvailabilityReader, DapperSimulatorAvailabilityReader>();
        services.AddScoped<ISimulatorEvaluationReader, DapperSimulatorEvaluationReader>();
        return services;
    }
}
