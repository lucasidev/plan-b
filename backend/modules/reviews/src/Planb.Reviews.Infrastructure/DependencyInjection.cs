using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Reviews.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddReviewsInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: Register ReviewsDbContext with schema "reviews" (incluye pgvector extension),
        // repositories, query services, embeddings worker (ADR-0007, ADR-0013).
        return services;
    }
}
