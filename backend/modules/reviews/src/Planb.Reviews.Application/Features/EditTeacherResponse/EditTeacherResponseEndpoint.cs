using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.EditTeacherResponse;

/// <summary>
/// PATCH /api/reviews/{id}/teacher-response (US-041).
///
/// Auth: JwtBearer. Solo el docente verificado que respondió puede editar; revalida verified al
/// momento del edit. Cooldown de 3 edits/24h devuelve 429.
/// </summary>
public sealed class EditTeacherResponseEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/reviews/{id:guid}/teacher-response", async (
            Guid id,
            EditTeacherResponseRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new EditTeacherResponseCommand(id, userId.Value, body.Text);

            try
            {
                var result = await bus.InvokeAsync<Result<EditTeacherResponseResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
                }

                var error = result.Error;
                var statusCode = error.Code switch
                {
                    "reviews.response.edit_cooldown_exceeded" => StatusCodes.Status429TooManyRequests,
                    _ => error.Type switch
                    {
                        ErrorType.Validation => StatusCodes.Status400BadRequest,
                        ErrorType.NotFound => StatusCodes.Status404NotFound,
                        ErrorType.Conflict => StatusCodes.Status409Conflict,
                        ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                        ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                        _ => StatusCodes.Status500InternalServerError,
                    },
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
        .WithName("Reviews_EditTeacherResponse")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<EditTeacherResponseResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }
}
