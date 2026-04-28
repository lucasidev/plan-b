using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Features.SignIn;
using Wolverine;

namespace Planb.Identity.Application.Features.SignOut;

/// <summary>
/// POST /api/identity/sign-out. Revokes the refresh token (if any) and clears both auth
/// cookies on the way out. Always returns 204. Idempotent: callable with no cookies, with
/// an unknown refresh, or with one already revoked.
///
/// The access cookie is cleared with `Path=/` and the refresh cookie with
/// `Path=/api/identity` to match what <see cref="SignInEndpoint"/> set; without matching
/// paths the browser would refuse to delete the entries and they'd linger until natural
/// expiry. See ADR-0023 for the cookie-shape contract.
/// </summary>
public sealed class SignOutEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/sign-out", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var refreshToken = http.Request.Cookies[SignInEndpoint.RefreshCookieName];
            await bus.InvokeAsync(new SignOutCommand(refreshToken), ct);

            ClearAuthCookies(http.Response, http.Request.IsHttps);
            return Results.NoContent();
        })
        .WithName("Identity_SignOut")
        .WithTags("Identity")
        .Produces(StatusCodes.Status204NoContent);
    }

    private static void ClearAuthCookies(HttpResponse response, bool isHttps)
    {
        // Cookie deletion requires the same Path / Secure / SameSite the cookie was set with;
        // the browser uses those attributes to identify which cookie to drop.
        response.Cookies.Delete(SignInEndpoint.AccessCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
        });
        response.Cookies.Delete(SignInEndpoint.RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = SignInEndpoint.RefreshCookiePath,
        });
    }
}
