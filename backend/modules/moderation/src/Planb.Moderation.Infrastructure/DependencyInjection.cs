using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Moderation.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddModerationInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: Register ModerationDbContext with schema "moderation", repositories, audit log writer.
        return services;
    }
}
