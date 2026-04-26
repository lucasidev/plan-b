using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.VerifyEmail;

public sealed class VerifyEmailEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/verify-email", async (
            VerifyEmailRequest request,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new VerifyEmailCommand(request.Token);
            try
            {
                var result = await bus.InvokeAsync<Result<VerifyEmailResponse>>(command, ct);

                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : ToProblem(result.Error);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_VerifyEmail")
        .WithTags("Identity")
        .Produces<VerifyEmailResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status410Gone)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.Validation => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ErrorType.NotFound => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status404NotFound),
        ErrorType.Conflict => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status409Conflict),
        ErrorType.Unauthorized => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status401Unauthorized),
        ErrorType.Forbidden => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status403Forbidden),
        _ => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status500InternalServerError),
    };
}
