using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: Register IdentityDbContext with schema "identity", repositories, query services, JWT issuer, password hasher.
        return services;
    }
}
