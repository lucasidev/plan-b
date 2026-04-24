using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;

namespace Planb.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "Connection string 'Planb' is not configured.");

        services.AddDbContext<IdentityDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MapEnum<UserRole>(
                    enumName: "user_role",
                    schemaName: IdentityDbContext.SchemaName);

                npgsql.MigrationsHistoryTable(
                    tableName: "__ef_migrations_history",
                    schema: IdentityDbContext.SchemaName);
            });
        });

        return services;
    }
}
