using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
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
    /// </summary>
    public static IServiceCollection AddReviewsInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IReviewsUnitOfWork, ReviewsUnitOfWork>();

        // Write-side del catálogo del instrumento (US-198, ADR-0082).
        services.AddScoped<ICatalogRepository, CatalogRepository>();

        // Write-side de la reseña de tres capas (US-146, ADR-0082).
        services.AddScoped<IReviewRepository, ReviewRepository>();

        // El instrumento vigente, que es lo que la pantalla de reseñar pregunta (US-146).
        services.AddScoped<ICurrentInstrumentQueryService, DapperCurrentInstrumentQueryService>();

        // Lo que una cuenta aportó, para poder corregirlo o borrarlo (US-165, US-166).
        services.AddScoped<IMyReviewsQueryService, DapperMyReviewsQueryService>();
        services.AddScoped<IFreeTextQueryService, DapperFreeTextQueryService>();

        // Los conteos que alimentan las fichas de cátedra y de materia (US-147, US-148, ADR-0083).
        services.AddScoped<IChairTallyQueryService, DapperChairTallyQueryService>();

        // Cuánto de una carrera está medido, para su ficha (US-134).
        services.AddScoped<ICareerCoverageQueryService, DapperCareerCoverageQueryService>();

        // Las cátedras que una cuenta reseñó, con sus voces, para Inicio (US-231).
        services.AddScoped<IMyReviewedChairsQueryService, DapperMyReviewedChairsQueryService>();

        // Con qué otras materias se llevó una, para su ficha (US-143).
        services.AddScoped<ISubjectPairQueryService, DapperSubjectPairQueryService>();

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
        });
    }
}
