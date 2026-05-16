using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Features.CareerPlanImports;
using Planb.Academic.Application.Services.CareerPlanParser;

namespace Planb.Academic.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Wires Academic application services. La interface IAcademicQueryService se registra
    /// desde Infrastructure. Wolverine descubre handlers via
    /// opts.Discovery.IncludeAssembly(typeof(DependencyInjection).Assembly) en el host.
    ///
    /// US-088 introduce el parser de plan + validators de los nuevos commands.
    /// </summary>
    public static IServiceCollection AddAcademicApplication(this IServiceCollection services)
    {
        // Parser pure stateless: thread-safe, singleton.
        services.AddSingleton<ICareerPlanParser, CareerPlanParser>();

        // FluentValidation validators. Wolverine middleware los inyecta cuando recibe commands.
        services.AddValidatorsFromAssemblyContaining<CreateCareerPlanImportValidator>(
            includeInternalTypes: true);

        return services;
    }
}
