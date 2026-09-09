using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Planb.Academic.Application.Abstractions.Pdf;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Application.Features.AdminAcademicTerms;
using Planb.Academic.Application.Features.AdminCareerPlans;
using Planb.Academic.Application.Features.AdminCareers;
using Planb.Academic.Application.Features.AdminSubjects;
using Planb.Academic.Application.Features.AdminTeachers;
using Planb.Academic.Application.Features.AdminUniversities;
using Planb.Academic.Application.Features.CareerPlanImportQueue;
using Planb.Academic.Application.Features.OfficialFacts;
using Planb.Academic.Application.Features.Search;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.AgnAudits;
using Planb.Academic.Infrastructure.Georef;
using Planb.Academic.Infrastructure.Pdf;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Academic.Infrastructure.Persistence.Repositories;
using Planb.Academic.Infrastructure.Reading;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Academic.Application.Features.AdminChairs;

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

        // US-061: admin CRUD de carreras + planes de estudio
        services.AddScoped<IAdminCareerReader, DapperAdminCareerReader>();
        services.AddScoped<IAdminCareerPlanReader, DapperAdminCareerPlanReader>();

        // US-064: admin CRUD de períodos lectivos
        services.AddScoped<IAdminAcademicTermReader, DapperAdminAcademicTermReader>();
        services.AddScoped<IAcademicTermRepository, AcademicTermRepository>();

        services.AddScoped<AcademicSeeder>();

        // US-088: writes al catálogo cross-aggregate + cola de staff (aprobar/rechazar imports)
        services.AddScoped<IAcademicUnitOfWork, AcademicUnitOfWork>();
        services.AddScoped<ICareerRepository, CareerRepository>();
        services.AddScoped<ICareerPlanRepository, CareerPlanRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();
        services.AddScoped<ICareerPlanImportRepository, CareerPlanImportRepository>();
        services.AddScoped<IImportQueueReader, DapperImportQueueReader>();

        // US-062: correlativas + soft delete de materias + admin CRUD de materias
        services.AddScoped<IPrerequisiteRepository, PrerequisiteRepository>();
        services.AddSingleton<IPrerequisiteGraphValidator, PrerequisiteGraphValidator>();
        services.AddScoped<IAdminSubjectReader, DapperAdminSubjectReader>();

        // US-063: admin CRUD de docentes
        services.AddScoped<ITeacherRepository, TeacherRepository>();

        // US-196: cátedras
        services.AddScoped<IChairRepository, ChairRepository>();

        // Las cátedras de una materia para el backoffice, con su equipo y sus tramos (US-196).
        services.AddScoped<IAdminChairReader, DapperAdminChairReader>();

        // US-060: admin CRUD de universidades
        services.AddScoped<IUniversityRepository, UniversityRepository>();
        services.AddSingleton<IPdfTextExtractor, PdfPigPdfTextExtractor>();

        // ADR-0090: unidad académica + datos oficiales
        services.AddScoped<IAcademicUnitRepository, AcademicUnitRepository>();
        services.AddScoped<IOfficialFactRepository, OfficialFactRepository>();
        services.AddScoped<IOfficialFactReader, DapperOfficialFactReader>();

        // R6 tarea 19: resuelve la localidad de cada AcademicUnit contra Georef al sembrar. Un
        // HttpClient singleton alcanza (el seed hace un puñado de GETs una vez al arrancar, no el
        // volumen que justificaría IHttpClientFactory). Timeout corto, no el default de 100s: si
        // Georef no responde, el seed no puede quedar colgado esperando, tiene que seguir sin esa
        // localidad.
        services.AddSingleton<IGeorefLocalityResolver>(sp => new GeorefLocalityResolver(
            new HttpClient
            {
                BaseAddress = new Uri("https://apis.datos.gob.ar/georef/api/"),
                Timeout = TimeSpan.FromSeconds(10),
            },
            sp.GetRequiredService<ILogger<GeorefLocalityResolver>>()));

        // Issue #506: cliente de la API de la AGN + el import de auditorías por institución. Un
        // único HttpClient para todo el proceso (sin IHttpClientFactory: este proyecto no es
        // Sdk.Web y Microsoft.Extensions.Http no vale la pena solo por el azúcar de AddHttpClient,
        // cuando HttpClient ya es parte del framework). Timeout por request, no total (HttpClient.
        // Timeout se aplica a cada GetAsync, no a la vida entera del cliente): el import pagina
        // cientos de páginas, así que un timeout total cortaría la corrida antes de terminar.
        services.AddSingleton<IAgnReportsClient>(sp => new AgnReportsApiClient(
            new HttpClient
            {
                BaseAddress = new Uri(AgnReportsApiClient.BaseUrl),
                Timeout = TimeSpan.FromSeconds(30),
            },
            sp.GetRequiredService<ILogger<AgnReportsApiClient>>()));
        services.AddScoped<AgnAuditImporter>();

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
