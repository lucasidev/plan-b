using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.AdminUsers;

public sealed class ChangeUserAccessEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/users/{id:guid}/suspend", async (
            Guid id, SuspendUserRequest body, HttpContext http, IMessageBus bus, CancellationToken ct) =>
            id == Guid.Empty ? Results.Problem(statusCode: 400, title: "identity.users.invalid_id", detail: "A user id is required.") :
            ToHttp(await bus.InvokeAsync<Result>(new ChangeUserAccessCommand(new UserId(id),
                CurrentUser.RequireUserId(http).Value, true, body.Reason), ct)))
            .WithName("Identity_SuspendUser").WithTags("Identity")
            .RequireAuthorization(p => p.RequireRole("Admin"));

        app.MapPost("/api/identity/users/{id:guid}/restore", async (
            Guid id, HttpContext http, IMessageBus bus, CancellationToken ct) =>
            id == Guid.Empty ? Results.Problem(statusCode: 400, title: "identity.users.invalid_id", detail: "A user id is required.") :
            ToHttp(await bus.InvokeAsync<Result>(new ChangeUserAccessCommand(new UserId(id),
                CurrentUser.RequireUserId(http).Value, false, null), ct)))
            .WithName("Identity_RestoreUser").WithTags("Identity")
            .RequireAuthorization(p => p.RequireRole("Admin"));
    }

    private static IResult ToHttp(Result result)
    {
        if (result.IsSuccess) return Results.NoContent();
        var error = result.Error;
        return Results.Problem(title: error.Code, detail: error.Message, statusCode: error.Type switch
        {
            ErrorType.NotFound => 404,
            ErrorType.Forbidden => 403,
            ErrorType.Validation => 400,
            ErrorType.Conflict => 409,
            _ => 500,
        });
    }
}

public sealed record SuspendUserRequest(string? Reason);
