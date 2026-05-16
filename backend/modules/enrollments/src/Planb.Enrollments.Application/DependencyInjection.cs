using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Planb.Enrollments.Application.Features.RegisterEnrollment;
using Planb.Enrollments.Application.Services.HistorialParser;

namespace Planb.Enrollments.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddEnrollmentsApplication(this IServiceCollection services)
    {
        // FluentValidation validators del módulo. Wolverine los descubre del DI cuando inyecta
        // IValidator<TCommand> en el middleware de validación. Pasamos un tipo conocido del
        // assembly como ancla (no podemos usar `DependencyInjection` porque es static).
        services.AddValidatorsFromAssemblyContaining<RegisterEnrollmentValidator>(
            includeInternalTypes: true);

        // Parser heurístico stateless: thread-safe (regex compiladas + diccionarios pasados por
        // parámetro). Singleton.
        services.AddSingleton<IHistorialParser, HistorialParser>();

        return services;
    }
}
