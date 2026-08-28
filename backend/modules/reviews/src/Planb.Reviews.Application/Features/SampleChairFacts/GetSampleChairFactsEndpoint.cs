using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.SampleChairFacts;

/// <summary>
/// GET /api/reviews/chairs/sample (US-221): la ficha que la entrada muestra como muestra.
///
/// <para>
/// Público y sin cuenta, como la ficha que devuelve: es la primera pantalla que ve alguien que
/// llegó de un link, y pedirle cuenta ahí sería pedirle que confíe antes de ver.
/// </para>
///
/// <para>
/// 404 cuando ninguna cátedra publica todavía. La entrada lo trata como un estado y no como un
/// error: dice que todavía no hay nada publicado, en vez de mostrar un ejemplo inventado.
/// </para>
/// </summary>
public sealed class GetSampleChairFactsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/chairs/sample", async (
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<GetChairFactsResponse>>(
                new GetSampleChairFactsQuery(), ct);

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
        .WithName("Reviews_GetSampleChairFacts")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<GetChairFactsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
