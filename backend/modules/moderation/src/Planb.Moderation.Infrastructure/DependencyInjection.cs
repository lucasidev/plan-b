using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Application.Features.ReportDetail;
using Planb.Moderation.Application.Features.ReportQueue;
using Planb.Moderation.Infrastructure.Persistence;
using Planb.Moderation.Infrastructure.Persistence.Repositories;
using Planb.Moderation.Infrastructure.Reading;

namespace Planb.Moderation.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires Moderation infrastructure adapters (US-019). The <see cref="ModerationDbContext"/>
    /// is registered by the host with <c>AddDbContextWithWolverineIntegration</c> so report
    /// writes + published events share one Postgres transaction (outbox, ADR-0015).
    /// </summary>
    public static IServiceCollection AddModerationInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IModerationUnitOfWork, ModerationUnitOfWork>();
        services.AddScoped<IReviewReportRepository, ReviewReportRepository>();

        // US-050: cola de reportes (read model Dapper cross-schema).
        services.AddScoped<IReportQueueReader, DapperReportQueueReader>();

        // US-051: detalle del report (read model Dapper cross-schema).
        services.AddScoped<IReportDetailReader, DapperReportDetailReader>();

        return services;
    }

    /// <summary>
    /// Configures the Moderation DbContext options. The host invokes this from
    /// <c>AddDbContextWithWolverineIntegration</c>.
    /// </summary>
    public static void ConfigureModerationDbContext(
        DbContextOptionsBuilder builder, string connectionString)
    {
        builder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable(
                tableName: "__ef_migrations_history",
                schema: ModerationDbContext.SchemaName);
        });
    }
}
