using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Planb.Reviews.Application.Embeddings;

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

    /// <summary>
    /// Sobrecarga con <see cref="IConfiguration"/> para bindear el feature flag de embeddings.
    /// El host la invoca cuando quiera enabledar la sección <c>Reviews:Embeddings</c>; si solo
    /// llama <see cref="AddReviewsApplication(IServiceCollection)"/>, el flag queda en default
    /// (off) y el handler stub no hace nada.
    /// </summary>
    public static IServiceCollection AddReviewsApplication(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ReviewEmbeddingComputeOptions>(
            configuration.GetSection(ReviewEmbeddingComputeOptions.SectionName));
        return services.AddReviewsApplication();
    }
}
