using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.CareerFacts;

/// <summary>
/// GET /api/reviews/careers/{careerId}/facts (US-134, ADR-0085): la ficha pública de una carrera.
///
/// <para>
/// Vive en reviews y no en academic aunque la carrera sea de academic: lo que esta ruta agrega
/// (la cobertura) es lo que las reseñas dicen de la carrera, y esa derivación es de este módulo. La
/// identidad de la carrera se le pide a academic por contrato.
/// </para>
/// </summary>
public sealed class GetCareerFactsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/careers/{careerId:guid}/facts", async (
            Guid careerId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<GetCareerFactsResponse>>(
                new GetCareerFactsQuery(careerId), ct);

            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }

            var error = result.Error;
            return Results.Problem(
                title: error.Code,
                detail: error.Message,
                statusCode: error.Type == ErrorType.NotFound
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status500InternalServerError);
        })
        .WithName("Reviews_GetCareerFacts")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<GetCareerFactsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
