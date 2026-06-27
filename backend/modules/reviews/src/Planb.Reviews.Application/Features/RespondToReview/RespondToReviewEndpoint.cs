using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.RespondToReview;

/// <summary>
/// POST /api/reviews/{id}/teacher-response (US-040).
///
/// Auth: JwtBearer. Solo el docente reseñado, verificado, puede responder. Una sola respuesta por
/// reseña (idempotente: el reintento devuelve la existente). Devuelve 200 con la respuesta.
/// </summary>
public sealed class RespondToReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviews/{id:guid}/teacher-response", async (
            Guid id,
            RespondToReviewRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new RespondToReviewCommand(id, userId.Value, body.Text);

            try
            {
                var result = await bus.InvokeAsync<Result<RespondToReviewResponse>>(command, ct);
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
                    title: error.Code, detail: error.Message, statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Reviews_RespondToReview")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<RespondToReviewResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
