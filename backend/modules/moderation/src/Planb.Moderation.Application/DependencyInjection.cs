using Microsoft.Extensions.DependencyInjection;

namespace Planb.Moderation.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddModerationApplication(this IServiceCollection services)
    {
        // TODO: Register validators, application services, auto-hide threshold policy (ADR-0010).
        return services;
    }
}
