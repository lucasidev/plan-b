using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Planb.Planning.Application.Features.EvaluateSimulation;
using Planb.Planning.Domain.Availability;

namespace Planb.Planning.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddPlanningApplication(this IServiceCollection services)
    {
        // US-016: ISubjectAvailabilityEvaluator es un domain service puro (sin dependencias, sin
        // estado), mismo criterio que IPrerequisiteGraphValidator en Academic: se registra
        // Singleton.
        services.AddSingleton<ISubjectAvailabilityEvaluator, SubjectAvailabilityEvaluator>();

        // FluentValidation validators del módulo. Wolverine los descubre del DI cuando inyecta
        // IValidator<TCommand> en el middleware de validación. Escanea todo el assembly, así que
        // los validators de US-023 (Create/UpdateSimulationDraft) se registran solos.
        services.AddValidatorsFromAssemblyContaining<EvaluateSimulationValidator>(
            includeInternalTypes: true);

        return services;
    }
}
