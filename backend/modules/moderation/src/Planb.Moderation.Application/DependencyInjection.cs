using Microsoft.Extensions.DependencyInjection;

namespace Planb.Moderation.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddModerationApplication(this IServiceCollection services)
    {
        // Validators are picked up by Wolverine's FluentValidation middleware (assembly
        // scan in the host); handlers are static + Wolverine-discovered. The auto-hide
        // threshold is read from configuration per-request (Moderation:AutoHideThreshold),
        // so nothing to register here yet beyond keeping the entry point.
        return services;
    }
}
