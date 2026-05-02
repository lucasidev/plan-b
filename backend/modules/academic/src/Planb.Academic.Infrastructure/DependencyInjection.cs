using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Academic.Infrastructure.Reading;
using Planb.Academic.Infrastructure.Seeding;

namespace Planb.Academic.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires los adapters de infrastructure de Academic. El AcademicDbContext lo registra el
    /// host con AddDbContextWithWolverineIntegration; aca agregamos el query service Dapper +
    /// el seeder.
    /// </summary>
    public static IServiceCollection AddAcademicInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IAcademicQueryService, DapperAcademicQueryService>();
        services.AddScoped<AcademicSeeder>();
        return services;
    }

    /// <summary>
    /// Configures <see cref="AcademicDbContext"/> options. El host invoca esto desde
    /// AddDbContextWithWolverineIntegration para co-administrar transacciones.
    /// </summary>
    public static void ConfigureAcademicDbContext(
        DbContextOptionsBuilder builder, string connectionString)
    {
        builder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable(
                tableName: "__ef_migrations_history",
                schema: AcademicDbContext.SchemaName);
        });
    }
}
