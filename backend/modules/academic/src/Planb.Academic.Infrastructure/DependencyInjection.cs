using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Academic.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddAcademicInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: Register AcademicDbContext with schema "academic", repositories, query services.
        return services;
    }
}
