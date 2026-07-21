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
        // Singleton. El aggregate SimulationDraft y sus handlers de escritura llegan con US-023
        // (Fase 4); hasta entonces no hay nada más para registrar acá (ADR-0029).
        services.AddSingleton<ISubjectAvailabilityEvaluator, SubjectAvailabilityEvaluator>();

        // FluentValidation validators del módulo. Wolverine los descubre del DI cuando inyecta
        // IValidator<TCommand> en el middleware de validación. EvaluateSimulationValidator es el
        // primero del módulo (GetAvailableSubjects no necesita validator: su query solo lleva el
        // UserId del JWT).
        services.AddValidatorsFromAssemblyContaining<EvaluateSimulationValidator>(
            includeInternalTypes: true);

        return services;
    }
}
