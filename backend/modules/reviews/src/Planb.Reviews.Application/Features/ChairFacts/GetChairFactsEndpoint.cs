using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.ChairFacts;

/// <summary>
/// GET /api/reviews/chairs/{chairId}/facts (US-147, ADR-0083): la ficha de una cátedra.
///
/// <para>
/// Público y sin cuenta, que es la mitad de la tesis: el dato existe para presionar, y una presión
/// que solo ven los registrados no presiona. Producir pide cuenta; leer, nunca.
/// </para>
/// </summary>
public sealed class GetChairFactsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/chairs/{chairId:guid}/facts", async (
            Guid chairId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<GetChairFactsResponse>>(
                new GetChairFactsQuery(chairId), ct);

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
        .WithName("Reviews_GetChairFacts")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<GetChairFactsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
