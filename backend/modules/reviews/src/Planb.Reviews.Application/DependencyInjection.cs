using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Reviews.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddReviewsApplication(this IServiceCollection services)
    {
        // FluentValidation: descubre validators internos del assembly (PublishReviewValidator es
        // internal sealed, sigue el patrón de Identity/Enrollments).
        services.AddValidatorsFromAssembly(
            typeof(DependencyInjection).Assembly,
            includeInternalTypes: true);

        return services;
    }
}
