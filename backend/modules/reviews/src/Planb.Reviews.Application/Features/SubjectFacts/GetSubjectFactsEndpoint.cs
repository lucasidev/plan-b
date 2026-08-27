using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.SubjectFacts;

/// <summary>
/// GET /api/reviews/subjects/{subjectId}/facts (US-129, ADR-0085): la ficha de una materia.
///
/// <para>
/// Vive en reviews y no en academic aunque la materia sea de academic: lo que esta ruta devuelve no
/// es el catálogo de la materia sino lo que las reseñas dicen de ella, y esa derivación es de este
/// módulo. La identidad de la materia se le pide a academic por contrato.
/// </para>
/// </summary>
public sealed class GetSubjectFactsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/subjects/{subjectId:guid}/facts", async (
            Guid subjectId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<GetSubjectFactsResponse>>(
                new GetSubjectFactsQuery(subjectId), ct);

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
        .WithName("Reviews_GetSubjectFacts")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<GetSubjectFactsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
