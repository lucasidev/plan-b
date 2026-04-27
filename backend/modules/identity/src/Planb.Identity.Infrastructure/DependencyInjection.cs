using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Email;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Persistence.Repositories;
using Planb.Identity.Infrastructure.Security;

namespace Planb.Identity.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires Identity infrastructure adapters (repositories, password hasher, token generator,
    /// email sender). The <see cref="IdentityDbContext"/> itself is registered by the host so it
    /// can be enrolled in Wolverine's outbox via <c>AddDbContextWithWolverineIntegration</c>.
    /// </summary>
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IIdentityUnitOfWork, IdentityUnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();

        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<ITokenGenerator, RandomTokenGenerator>();

        services.AddOptions<SmtpOptions>()
            .Bind(configuration.GetSection(SmtpOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddOptions<VerificationEmailOptions>()
            .Bind(configuration.GetSection(VerificationEmailOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddScoped<IVerificationEmailSender, SmtpVerificationEmailSender>();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddSingleton<IJwtIssuer, JwtIssuer>();

        services.AddSingleton<IRefreshTokenStore, RedisRefreshTokenStore>();

        return services;
    }

    /// <summary>
    /// Configures <see cref="IdentityDbContext"/> options. The host calls this from inside
    /// <c>AddDbContextWithWolverineIntegration</c> so Wolverine can co-manage transactions.
    /// </summary>
    public static void ConfigureIdentityDbContext(
        DbContextOptionsBuilder builder, string connectionString)
    {
        builder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MapEnum<UserRole>(
                enumName: "user_role",
                schemaName: IdentityDbContext.SchemaName);

            npgsql.MigrationsHistoryTable(
                tableName: "__ef_migrations_history",
                schema: IdentityDbContext.SchemaName);
        });
    }
}
