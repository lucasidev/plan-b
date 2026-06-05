using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Reviews.Application.Abstractions.ContentFilter;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Infrastructure.ContentFilter;
using Planb.Reviews.Infrastructure.Persistence;
using Planb.Reviews.Infrastructure.Persistence.Queries;
using Planb.Reviews.Infrastructure.Persistence.Repositories;

namespace Planb.Reviews.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires Reviews infrastructure adapters. El <see cref="ReviewsDbContext"/> lo registra
    /// el host con <c>AddDbContextWithWolverineIntegration</c> para que las writes entren al
    /// outbox.
    ///
    /// Embedding worker queda pendiente: feature-flag off por default (ADR-0007, ADR-0013).
    /// </summary>
    public static IServiceCollection AddReviewsInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IReviewsUnitOfWork, ReviewsUnitOfWork>();
        services.AddScoped<IReviewRepository, ReviewRepository>();

        // Cross-schema read for US-048 tab Pendientes. Scoped to match the request lifetime; the
        // Dapper service opens its own connection per call so there is no shared state.
        services.AddScoped<IPendingReviewsQueryService, DapperPendingReviewsQueryService>();

        // Singleton: compila los regex una sola vez.
        services.AddSingleton<IReviewContentFilter, RegexReviewContentFilter>();

        return services;
    }

    /// <summary>
    /// Configura el DbContext options del módulo Reviews. El host lo invoca desde
    /// <c>AddDbContextWithWolverineIntegration</c>.
    /// </summary>
    public static void ConfigureReviewsDbContext(
        DbContextOptionsBuilder builder, string connectionString)
    {
        builder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable(
                tableName: "__ef_migrations_history",
                schema: ReviewsDbContext.SchemaName);
            npgsql.UseVector();
        });
    }
}
