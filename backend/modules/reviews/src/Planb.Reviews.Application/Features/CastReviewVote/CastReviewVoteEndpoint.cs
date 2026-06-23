using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.CastReviewVote;

/// <summary>
/// POST /api/reviews/{id}/vote. Vota la utilidad de una reseña (helpfulness). Requiere sesión
/// (cualquier member logueado, salvo el autor). Toggle: tocar el mismo botón saca el voto.
/// Devuelve los conteos resultantes + el voto del usuario.
/// </summary>
public sealed class CastReviewVoteEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviews/{id:guid}/vote", async (
            Guid id,
            CastReviewVoteRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = new CastReviewVoteCommand(id, userId.Value, body.Helpful);

            try
            {
                var result = await bus.InvokeAsync<Result<CastReviewVoteResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
                }

                var error = result.Error;
                var statusCode = error.Type switch
                {
                    ErrorType.Validation => StatusCodes.Status400BadRequest,
                    ErrorType.NotFound => StatusCodes.Status404NotFound,
                    ErrorType.Conflict => StatusCodes.Status409Conflict,
                    ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                    ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                    _ => StatusCodes.Status500InternalServerError,
                };

                return Results.Problem(
                    title: error.Code,
                    detail: error.Message,
                    statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Reviews_CastReviewVote")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<CastReviewVoteResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
