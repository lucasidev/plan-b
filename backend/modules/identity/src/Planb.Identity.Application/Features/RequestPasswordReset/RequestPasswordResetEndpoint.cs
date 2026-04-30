using System.Security.Cryptography;
using System.Text;
using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.RequestPasswordReset;

/// <summary>
/// POST /api/identity/forgot-password.
///
/// Per ADR-0034 patrón #2 the endpoint enforces a sliding-window rate limit per source IP
/// before delegating to the handler. The handler itself is silent (always returns success);
/// the differentiation between "too many attempts" and "we processed your request" lives at
/// the HTTP boundary because rate limit is an infra concern.
///
/// 5 attempts per hour per IP is the agreed AC. Tighter than the AC of US-021 (resend
/// verification, 3/hour) because forgot-password's attack surface is stricter.
/// </summary>
public sealed class RequestPasswordResetEndpoint : ICarterModule
{
    private const int MaxRequestsPerWindow = 5;
    private static readonly TimeSpan Window = TimeSpan.FromHours(1);

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/forgot-password", async (
            RequestPasswordResetRequest request,
            HttpContext http,
            IRateLimiter rateLimiter,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var ipKey = $"identity:ratelimit:forgot-password:{HashIp(http)}";
            var rateCheck = await rateLimiter.TryAcquireAsync(ipKey, Window, MaxRequestsPerWindow, ct);
            if (!rateCheck.Allowed)
            {
                return Results.Problem(
                    title: "identity.rate_limit.exceeded",
                    detail: "Too many password-reset attempts. Try again later.",
                    statusCode: StatusCodes.Status429TooManyRequests);
            }

            var command = new RequestPasswordResetCommand(request.Email);
            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                // Anti-enumeration: success regardless of whether the email exists. The
                // handler may surface internal failures (token generator returning blank);
                // in that case, log via Problem so a regression is visible without changing
                // user-facing behavior.
                return result.IsSuccess
                    ? Results.NoContent()
                    : Results.Problem(
                        title: result.Error.Code,
                        detail: result.Error.Message,
                        statusCode: StatusCodes.Status500InternalServerError);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_RequestPasswordReset")
        .WithTags("Identity")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }

    /// <summary>
    /// Hex-encoded SHA-256 of the source IP. Keeps PII out of Redis keys (per the
    /// "no PII in plain" rule of redis-key-patterns.md). Falls back to a stable string for
    /// requests without a connection IP (test harness, headless health checks); those all
    /// share a bucket which is fine because they're trusted in practice.
    /// </summary>
    private static string HashIp(HttpContext http)
    {
        var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
