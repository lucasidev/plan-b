using Microsoft.Extensions.DependencyInjection;

namespace Planb.Planning.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddPlanningApplication(this IServiceCollection services)
    {
        // ADR-0029: Planning arranca vacío a propósito. US-016 (simulador de cuatrimestre)
        // todavía no persiste nada, su AC pide solo computación de read models sobre datos
        // que ya viven en Academic, Enrollments y Reviews (consumidos vía Contracts/, ver
        // csproj). El aggregate SimulationDraft y los handlers que lo comandan llegan con
        // US-023 (Fase 4); hasta entonces no hay nada más para registrar acá.
        return services;
    }
}
