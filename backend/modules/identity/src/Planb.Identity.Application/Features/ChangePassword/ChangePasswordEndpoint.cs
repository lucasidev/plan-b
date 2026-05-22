using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.ChangePassword;

/// <summary>
/// PATCH /api/me/password (US-079-i). Requiere sesión activa: el JwtBearer middleware extrae
/// el user del claim <c>sub</c> (cookie planb_session). El body trae <c>currentPassword</c> +
/// <c>newPassword</c>.
///
/// <para>
/// Mapeo de errores específicos del dominio a HTTP codes:
/// </para>
/// <list type="bullet">
///   <item><c>identity.password.current_invalid</c> → 401 (sin distinguir entre wrong password
///         y user inexistente).</item>
///   <item><c>identity.password.same_as_current</c> → 400 (la nueva debe ser distinta).</item>
///   <item><c>identity.password.too_weak</c> → 400 (mínimo 12 chars).</item>
///   <item><c>identity.password.too_long</c> → 400 (máximo 200 chars).</item>
///   <item><c>identity.account.disabled</c> → 403 (defensa, el guard del frontend ya lo evita).</item>
/// </list>
/// </summary>
public sealed class ChangePasswordEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/me/password", async (
            ChangePasswordRequest request,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = new ChangePasswordCommand(
                userId,
                request.CurrentPassword,
                request.NewPassword);

            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                return result.IsSuccess
                    ? Results.NoContent()
                    : ToProblem(result.Error);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_ChangePassword")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }

    private static IResult ToProblem(Error error) => error.Type switch
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
