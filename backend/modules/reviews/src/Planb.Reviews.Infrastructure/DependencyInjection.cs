using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Reviews.Application.Abstractions.ContentFilter;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Contracts;
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
        services.AddScoped<IReviewAuditLogRepository, ReviewAuditLogRepository>();
        services.AddScoped<IReviewVoteRepository, ReviewVoteRepository>();

        // Cross-schema reads for US-048 (tabs Pendientes, Mías and Explorar). Scoped to
        // match the request lifetime; the Dapper services open their own connection per
        // call so there is no shared state to leak across calls.
        services.AddScoped<IPendingReviewsQueryService, DapperPendingReviewsQueryService>();
        services.AddScoped<IMyReviewsQueryService, DapperMyReviewsQueryService>();
        services.AddScoped<IBrowseReviewsQueryService, DapperBrowseReviewsQueryService>();

        // Crowd insights agregados de una materia (US-002).
        services.AddScoped<ISubjectInsightsQueryService, DapperSubjectInsightsQueryService>();

        // Crowd insights agregados de un docente (US-003).
        services.AddScoped<ITeacherInsightsQueryService, DapperTeacherInsightsQueryService>();

        // Cross-BC contract consumed by Moderation (US-019) to resolve a review's author.
        services.AddScoped<IReviewQueryService, DapperReviewQueryService>();

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
