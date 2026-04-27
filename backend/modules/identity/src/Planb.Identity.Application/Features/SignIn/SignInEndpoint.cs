using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.SignIn;

public sealed class SignInEndpoint : ICarterModule
{
    /// <summary>
    /// Cookie carrying the access JWT. httpOnly so JS can't read it (XSS defense),
    /// SameSite=Lax so it accompanies top-level navigations and API calls from same site,
    /// Secure in non-Development environments. Path=/ so all routes see it.
    /// </summary>
    public const string AccessCookieName = "planb_session";

    /// <summary>
    /// Cookie carrying the opaque refresh token. Same flags as access; Path scoped to
    /// /api/identity so it's only sent on auth endpoints (smaller surface for CSRF).
    /// </summary>
    public const string RefreshCookieName = "planb_refresh";

    public const string RefreshCookiePath = "/api/identity";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/sign-in", async (
            SignInRequest request,
            IMessageBus bus,
            HttpContext http,
            CancellationToken ct) =>
        {
            var command = new SignInCommand(request.Email, request.Password);
            try
            {
                var result = await bus.InvokeAsync<Result<SignInResponse>>(command, ct);
                if (result.IsFailure) return ToProblem(result.Error);

                var response = result.Value;
                if (response.Tokens is { } tokens)
                {
                    SetAuthCookies(http.Response, tokens, http.Request.IsHttps);
                }
                return Results.Ok(response);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_SignIn")
        .WithTags("Identity")
        .Produces<SignInResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }

    internal static void SetAuthCookies(HttpResponse response, AuthTokens tokens, bool isHttps)
    {
        response.Cookies.Append(AccessCookieName, tokens.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = tokens.AccessTokenExpiresAt,
        });
        response.Cookies.Append(RefreshCookieName, tokens.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = RefreshCookiePath,
            Expires = tokens.RefreshTokenExpiresAt,
        });
    }

    internal static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.Validation => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ErrorType.Unauthorized => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status401Unauthorized),
        ErrorType.Forbidden => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status403Forbidden),
        ErrorType.NotFound => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status404NotFound),
        ErrorType.Conflict => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status409Conflict),
        _ => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status500InternalServerError),
    };
}
