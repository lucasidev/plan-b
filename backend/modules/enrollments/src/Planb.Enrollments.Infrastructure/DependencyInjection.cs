using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Enrollments.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddEnrollmentsInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: Register EnrollmentsDbContext with schema "enrollments", repositories, PDF parser, HistorialImport worker.
        return services;
    }
}
