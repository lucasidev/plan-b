using Microsoft.Extensions.DependencyInjection;

namespace Planb.Planning.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPlanningInfrastructure(this IServiceCollection services)
    {
        // ADR-0029: sin DbContext ni repositorio EF todavía. US-016 solo necesita leer, vía
        // Dapper, los read models cross-schema de Academic/Enrollments/Reviews que arma el
        // simulador; esos query services y el repositorio EF de SimulationDraft llegan con
        // US-023, cuando el aggregate exista. Hasta entonces no hay nada para registrar acá.
        return services;
    }
}
