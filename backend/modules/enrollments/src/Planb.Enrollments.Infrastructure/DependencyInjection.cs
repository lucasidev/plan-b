using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Enrollments.Application.Abstractions.Pdf;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Enrollments.Infrastructure.Pdf;
using Planb.Enrollments.Infrastructure.Persistence;
using Planb.Enrollments.Infrastructure.Persistence.Repositories;

namespace Planb.Enrollments.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires Enrollments infrastructure adapters. El <c>EnrollmentsDbContext</c> mismo lo
    /// registra el host con <c>AddDbContextWithWolverineIntegration</c> para que entre al
    /// outbox de Wolverine cuando aparezcan integration events del módulo.
    /// </summary>
    public static IServiceCollection AddEnrollmentsInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IEnrollmentsUnitOfWork, EnrollmentsUnitOfWork>();
        services.AddScoped<IEnrollmentRecordRepository, EnrollmentRecordRepository>();
        services.AddScoped<IHistorialImportRepository, HistorialImportRepository>();
        services.AddSingleton<IPdfTextExtractor, PdfPigPdfTextExtractor>();
        return services;
    }

    /// <summary>
    /// Configura el DbContext options del módulo. El host lo invoca desde
    /// <c>AddDbContextWithWolverineIntegration</c> (mismo patrón que Identity / Academic).
    /// </summary>
    public static void ConfigureEnrollmentsDbContext(
        DbContextOptionsBuilder builder, string connectionString)
    {
        builder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable(
                tableName: "__ef_migrations_history",
                schema: EnrollmentsDbContext.SchemaName);
        });
    }
}
