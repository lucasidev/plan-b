using Microsoft.Extensions.DependencyInjection;

namespace Planb.Academic.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddAcademicApplication(this IServiceCollection services)
    {
        // TODO: Register validators, application services.
        return services;
    }
}
