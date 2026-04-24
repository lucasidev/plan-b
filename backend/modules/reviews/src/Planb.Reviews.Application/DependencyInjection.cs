using Microsoft.Extensions.DependencyInjection;

namespace Planb.Reviews.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddReviewsApplication(this IServiceCollection services)
    {
        // TODO: Register validators, application services, filter automático.
        return services;
    }
}
