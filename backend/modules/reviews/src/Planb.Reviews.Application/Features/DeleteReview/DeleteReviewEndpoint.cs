using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.DeleteReview;

/// <summary>
/// DELETE /api/reviews/courses/{id} (US-165, US-166): borrar una reseña propia.
///
/// <para>
/// 204 cuando se borró. Una reseña ajena o inexistente devuelve 404 sin distinguir cuál de las dos
/// es: decir "existe pero no es tuya" ya sería decir que alguien reseñó esa cursada.
/// </para>
/// </summary>
public sealed class DeleteReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/reviews/courses/{id:guid}", async (
            Guid id,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var result = await bus.InvokeAsync<Result>(
                new DeleteReviewCommand(userId.Value, id), ct);

            if (result.IsSuccess)
            {
                return Results.NoContent();
            }

            var error = result.Error;
            return Results.Problem(
                title: error.Code,
                detail: error.Message,
                statusCode: error.Type == ErrorType.NotFound
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status500InternalServerError);
        })
        .WithName("Reviews_DeleteReview")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
