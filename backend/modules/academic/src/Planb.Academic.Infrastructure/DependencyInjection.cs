using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Abstractions.Pdf;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Application.Features.AdminTeachers;
using Planb.Academic.Application.Features.AdminUniversities;
using Planb.Academic.Application.Features.Search;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Pdf;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Academic.Infrastructure.Persistence.Repositories;
using Planb.Academic.Infrastructure.Reading;
using Planb.Academic.Infrastructure.Seeding;

namespace Planb.Academic.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires los adapters de infrastructure de Academic. El AcademicDbContext lo registra el
    /// host con AddDbContextWithWolverineIntegration; aca agregamos el query service Dapper +
    /// el seeder + repos del aggregate CareerPlanImport (US-088).
    /// </summary>
    public static IServiceCollection AddAcademicInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IAcademicQueryService, DapperAcademicQueryService>();
        services.AddScoped<ICatalogSearchReader, DapperCatalogSearchReader>();
        services.AddScoped<IAdminTeacherReader, DapperAdminTeacherReader>();
        services.AddScoped<IAdminUniversityReader, DapperAdminUniversityReader>();
        services.AddScoped<AcademicSeeder>();

        // US-088: writes al catálogo cross-aggregate
        services.AddScoped<IAcademicUnitOfWork, AcademicUnitOfWork>();
        services.AddScoped<ICareerRepository, CareerRepository>();
        services.AddScoped<ICareerPlanRepository, CareerPlanRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();
        services.AddScoped<ICareerPlanImportRepository, CareerPlanImportRepository>();

        // US-063: admin CRUD de docentes
        services.AddScoped<ITeacherRepository, TeacherRepository>();

        // US-060: admin CRUD de universidades
        services.AddScoped<IUniversityRepository, UniversityRepository>();
        services.AddSingleton<IPdfTextExtractor, PdfPigPdfTextExtractor>();
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
