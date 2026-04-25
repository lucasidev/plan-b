using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.RegisterUser;

public sealed class RegisterUserEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/register", async (
            RegisterUserRequest request,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new RegisterUserCommand(request.Email, request.Password);
            try
            {
                var result = await bus.InvokeAsync<Result<RegisterUserResponse>>(command, ct);

                return result.IsSuccess
                    ? Results.Created(
                        $"/api/identity/users/{result.Value.Id}",
                        result.Value)
                    : ToProblem(result.Error);
            }
            catch (ValidationException ex)
            {
                // Wolverine's FluentValidation middleware throws when the command shape itself is
                // invalid (empty, too short, etc). We surface that as RFC 7807 with the field
                // errors so the frontend can render them per-input.
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_RegisterUser")
        .WithTags("Identity")
        .Produces<RegisterUserResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.Validation => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ErrorType.Conflict => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status409Conflict),
        ErrorType.NotFound => Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: StatusCodes.Status404NotFound),
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
