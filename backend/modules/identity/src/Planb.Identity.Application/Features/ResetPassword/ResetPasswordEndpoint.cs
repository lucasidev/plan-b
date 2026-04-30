using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.ResetPassword;

/// <summary>
/// POST /api/identity/reset-password. Final step of the forgot-password flow. Mapping of
/// domain errors to HTTP codes follows the AC of US-033:
/// <list type="bullet">
///   <item>Validation (blank field, password too weak): 400.</item>
///   <item>Token not found: 404.</item>
///   <item>Token invalidated / consumed / expired / wrong purpose / account disabled / unverified: 409.</item>
/// </list>
/// </summary>
public sealed class ResetPasswordEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/reset-password", async (
            ResetPasswordRequest request,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new ResetPasswordCommand(request.Token, request.NewPassword);
            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                return result.IsSuccess
                    ? Results.NoContent()
                    : ToProblem(result.Error);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_ResetPassword")
        .WithTags("Identity")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.Validation => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ErrorType.NotFound => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status404NotFound),
        ErrorType.Conflict => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status409Conflict),
        ErrorType.Forbidden => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status403Forbidden),
        ErrorType.Unauthorized => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status401Unauthorized),
        _ => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status500InternalServerError),
    };
}
