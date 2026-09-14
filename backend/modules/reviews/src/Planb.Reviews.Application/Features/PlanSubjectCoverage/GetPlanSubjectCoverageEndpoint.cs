using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.PlanSubjectCoverage;

/// <summary>
/// GET /api/reviews/career-plans/{careerPlanId}/subject-coverage: para cada materia del plan con
/// al menos una reseña, cuántas cátedras y cuántas reseñas hay detrás y si ya cruzó el piso.
///
/// <para>
/// Trae el conteo que sostiene la decisión de cobertura, para poder mostrar el estado intermedio
/// ("junta 3, con 7 más publica") en vez de nada. Un plan inexistente o sin ninguna reseña
/// devuelve lista vacía, no 404: mismo criterio que el resto del catálogo público.
/// </para>
/// </summary>
public sealed class GetPlanSubjectCoverageEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/career-plans/{careerPlanId:guid}/subject-coverage", async (
            Guid careerPlanId,
            ICareerCoverageQueryService coverage,
            CancellationToken ct) =>
        {
            var views = await coverage.GetSubjectCoverageAsync(
                careerPlanId, PublishingRules.ChairMinimumReviews, ct);
            return Results.Ok(views);
        })
        .WithName("Reviews_GetPlanSubjectCoverage")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<IReadOnlyList<PlanSubjectCoverageView>>(StatusCodes.Status200OK);
    }
}
