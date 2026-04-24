using Microsoft.Extensions.DependencyInjection;

namespace Planb.Enrollments.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddEnrollmentsApplication(this IServiceCollection services)
    {
        // TODO: Register validators, application services.
        return services;
    }
}
