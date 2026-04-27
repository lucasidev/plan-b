using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Features.SignIn;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.Refresh;

public sealed class RefreshEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/refresh", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Refresh token comes from the cookie, never from the body. Body-only
            // would let JS lift it; cookie keeps it httpOnly.
            var refreshToken = http.Request.Cookies[SignInEndpoint.RefreshCookieName];
            var result = await bus.InvokeAsync<Result<RefreshResponse>>(
                new RefreshCommand(refreshToken ?? string.Empty), ct);

            if (result.IsFailure) return SignInEndpoint.ToProblem(result.Error);

            var response = result.Value;
            if (response.Tokens is { } tokens)
            {
                SignInEndpoint.SetAuthCookies(http.Response, tokens, http.Request.IsHttps);
            }
            return Results.Ok(response);
        })
        .WithName("Identity_Refresh")
        .WithTags("Identity")
        .Produces<RefreshResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
