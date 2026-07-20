using Microsoft.Extensions.DependencyInjection;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Infrastructure.Persistence.Queries;

namespace Planb.Planning.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPlanningInfrastructure(this IServiceCollection services)
    {
        // US-016: sin DbContext ni repositorio EF todavía (ADR-0029, sin persistencia hasta
        // US-023). El único read side hoy es el snapshot Dapper cross-schema del simulador.
        services.AddScoped<ISimulatorAvailabilityReader, DapperSimulatorAvailabilityReader>();
        return services;
    }
}
