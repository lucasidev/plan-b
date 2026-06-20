using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.SubjectInsights;

/// <summary>
/// GET /api/reviews/insights?subjectId={id} (US-002). Crowd insights agregados de una materia.
/// Público (el corpus es el producto). Sin <c>subjectId</c> devuelve 400.
///
/// Siempre 200 cuando hay subjectId: una materia sin reseñas (o un id inexistente) devuelve el
/// agregado vacío (count 0, promedios null, histograma en cero), no 404. La existencia de la
/// materia la decide la página vía GET /api/academic/subjects/{id}; este endpoint solo agrega
/// reseñas.
/// </summary>
public sealed class SubjectInsightsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/insights", async (
            Guid? subjectId,
            ISubjectInsightsQueryService insights,
            CancellationToken ct) =>
        {
            if (subjectId is null || subjectId == Guid.Empty)
            {
                return Results.Problem(
                    title: "reviews.insights.missing_subject_id",
                    detail: "subjectId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var result = await insights.GetForSubjectAsync(subjectId.Value, ct);
            return Results.Ok(result);
        })
        .WithName("Reviews_SubjectInsights")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<SubjectReviewInsights>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
