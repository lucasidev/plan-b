using Microsoft.Extensions.DependencyInjection;

namespace Planb.Identity.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityApplication(this IServiceCollection services)
    {
        // TODO: Register validators, application services.
        // Wolverine discovers handlers from this assembly via opts.Discovery.IncludeAssembly(...).
        return services;
    }
}
