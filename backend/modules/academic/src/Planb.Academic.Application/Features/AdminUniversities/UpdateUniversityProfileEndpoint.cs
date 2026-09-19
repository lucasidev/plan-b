using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminUniversities;

public sealed class UpdateUniversityProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/academic/universities/{id:guid}/profile", UpdateAsync)
            .WithName("Academic_UpdateUniversityProfile")
            .WithTags("Academic")
            .RequireAuthorization(policy => policy.RequireRole(AdminUniversityPolicy.RoleName));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateUniversityProfileRequest body,
        IMessageBus bus,
        CancellationToken ct)
    {
        if (id == Guid.Empty || !IsHttpUrl(body.WebsiteUrl))
        {
            return Results.BadRequest();
        }

        try
        {
            var command = new UpdateUniversityProfileCommand(
                id,
                body.WebsiteUrl,
                body.Address,
                body.Province,
                body.LocalityText);
            var result = await bus.InvokeAsync<Result<UpdateUniversityResponse>>(command, ct);

            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }

            var status = result.Error.Type == ErrorType.NotFound
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;
            return Results.Problem(title: result.Error.Code, detail: result.Error.Message, statusCode: status);
        }
        catch (ValidationException exception)
        {
            return Results.ValidationProblem(exception.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray()));
        }
    }

    private static bool IsHttpUrl(string? value) =>
        string.IsNullOrWhiteSpace(value)
        || (Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && string.IsNullOrEmpty(uri.UserInfo));
}

public sealed record UpdateUniversityProfileRequest(
    string? WebsiteUrl,
    string? Address,
    string? Province,
    string? LocalityText);
