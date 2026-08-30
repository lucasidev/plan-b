using System.Security.Cryptography;
using System.Text;
using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Abstractions.RateLimiting;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.RegisterUser;

/// <summary>
/// POST /api/identity/register.
///
/// Rate limit por CASILLA DE DESTINO (ADR-0076 punto 5): sin el, cualquiera manda cien
/// registros a la direccion de otro y esa persona recibe cien avisos de "alguien quiso
/// registrarse". La clave hashea el mail de destino, no la IP. Cuando se excede la ventana la
/// respuesta sigue siendo el MISMO 202: un 429 visible volveria a delatar (frenar antes para un
/// mail y no para otro dice cual tiene cuenta). El limite se traga el mail extra en silencio;
/// no protege el dato, protege la casilla.
///
/// Ventana amplia (10/dia) para no romper reintentos legitimos de una persona que no vio el mail.
/// </summary>
public sealed class RegisterUserEndpoint : ICarterModule
{
    private const int MaxRegistrationsPerWindow = 10;
    private static readonly TimeSpan Window = TimeSpan.FromDays(1);

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/register", async (
            RegisterUserRequest request,
            IRateLimiter rateLimiter,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var mailboxKey = $"identity:ratelimit:register:{HashEmail(request.Email)}";
            var rateCheck = await rateLimiter.TryAcquireAsync(
                mailboxKey, Window, MaxRegistrationsPerWindow, ct);
            if (!rateCheck.Allowed)
            {
                // Mismo 202 que el happy path: la casilla ya recibio demasiados avisos y este se
                // descarta, pero la respuesta no puede revelar que se descarto (ADR-0076).
                return Results.Accepted(value: new RegisterUserResponse(request.Email));
            }

            var command = new RegisterUserCommand(request.Email, request.Password, request.CareerPlanId);
            try
            {
                var result = await bus.InvokeAsync<Result<RegisterUserResponse>>(command, ct);

                // 202 sin Location: la respuesta dice "revisa tu casilla" y nada mas. Un 201
                // con la URL del usuario nuevo era distinguible del caso "ya tenia cuenta"
                // (ADR-0076).
                return result.IsSuccess
                    ? Results.Accepted(value: result.Value)
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
        .Produces<RegisterUserResponse>(StatusCodes.Status202Accepted)
        .ProducesProblem(StatusCodes.Status400BadRequest);
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

    /// <summary>
    /// SHA-256 hex del mail de destino, normalizado. Mantiene PII fuera de las claves de Redis
    /// (regla de redis-key-patterns.md) y hace que el limite sea por casilla, no por IP.
    /// </summary>
    private static string HashEmail(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
