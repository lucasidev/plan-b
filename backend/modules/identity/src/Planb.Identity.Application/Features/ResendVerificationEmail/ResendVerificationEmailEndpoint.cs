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

namespace Planb.Identity.Application.Features.ResendVerificationEmail;

/// <summary>
/// POST /api/identity/resend-verification (US-021).
///
/// Per ADR-0034 patrón #2 el endpoint enforce un sliding-window rate limit per source IP antes
/// de delegar al handler. El handler es silencioso (siempre Success); la diferenciación entre
/// "demasiados intentos" y "procesamos tu pedido" vive en el HTTP boundary porque rate limit es
/// un concern de infra.
///
/// 3 intentos por hora por IP es el AC. Más tight que forgot-password (5/hora) porque resend es
/// un canal que se activa fácilmente desde la UI (botón visible) y queremos evitar floods al
/// SMTP por usuarios impacientes.
/// </summary>
public sealed class ResendVerificationEmailEndpoint : ICarterModule
{
    private const int MaxRequestsPerWindow = 3;
    private static readonly TimeSpan Window = TimeSpan.FromHours(1);

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/resend-verification", async (
            ResendVerificationEmailRequest request,
            HttpContext http,
            IRateLimiter rateLimiter,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var ipKey = $"identity:ratelimit:resend-verification:{HashIp(http)}";
            var rateCheck = await rateLimiter.TryAcquireAsync(ipKey, Window, MaxRequestsPerWindow, ct);
            if (!rateCheck.Allowed)
            {
                return Results.Problem(
                    title: "identity.rate_limit.exceeded",
                    detail: "Too many resend-verification attempts. Try again later.",
                    statusCode: StatusCodes.Status429TooManyRequests);
            }

            var command = new ResendVerificationEmailCommand(request.Email);
            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                // Anti-enumeración: success regardless of whether the email exists. El handler
                // puede surface internal failures (token generator returning blank); en ese caso,
                // log via Problem para que la regresión sea visible sin cambiar user-facing.
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
        .WithName("Identity_ResendVerificationEmail")
        .WithTags("Identity")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }

    /// <summary>
    /// Hex-encoded SHA-256 del source IP. Mantiene PII fuera de las keys de Redis (regla de
    /// "no PII in plain" de redis-key-patterns.md). Fallback a string estable para requests sin
    /// connection IP (test harness, headless health checks); todos comparten un bucket lo cual
    /// está OK porque son trusted en práctica.
    /// </summary>
    private static string HashIp(HttpContext http)
    {
        var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
