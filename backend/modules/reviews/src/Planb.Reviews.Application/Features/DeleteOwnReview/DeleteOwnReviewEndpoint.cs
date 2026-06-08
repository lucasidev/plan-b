using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.DeleteOwnReview;

/// <summary>
/// DELETE /api/me/reviews/{id} (US-055). The author soft-deletes their own review.
///
/// Auth: JwtBearer extracts the user id from the <c>sub</c> claim. The <c>/me/</c> prefix
/// scopes this to the author; moderator removal (US-051) lives under
/// <c>/api/moderation/</c>. Idempotent: a second call returns 200 with the
/// already-deleted body.
/// </summary>
public sealed class DeleteOwnReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/me/reviews/{id:guid}", async (
            Guid id,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = new DeleteOwnReviewCommand(id, userId.Value);

            var result = await bus.InvokeAsync<Result<DeleteOwnReviewResponse>>(command, ct);
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
        })
        .WithName("Reviews_DeleteOwnReview")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<DeleteOwnReviewResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
