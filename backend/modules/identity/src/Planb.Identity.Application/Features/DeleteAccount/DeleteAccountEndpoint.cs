using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.DeleteAccount;

/// <summary>
/// DELETE /api/me/account (UC-038, Ley 25.326 art. 6).
///
/// Auth: JwtBearer middleware extrae el UserId del claim <c>sub</c>; el endpoint no acepta
/// userId como query/body. <c>.RequireAuthorization()</c> garantiza 401 si no hay sesión válida.
///
/// Mapeo de errores:
/// <list type="bullet">
///   <item>Sin sesión válida: 401 (middleware).</item>
///   <item>User no encontrado (ya borrado): 404 idempotent.</item>
///   <item>Happy path: 204 No Content.</item>
/// </list>
/// </summary>
public sealed class DeleteAccountEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/me/account", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = new DeleteAccountCommand(userId);
            var result = await bus.InvokeAsync<Result>(command, ct);

            if (result.IsSuccess)
            {
                return Results.NoContent();
            }

            var error = result.Error;
            var status = error.Type switch
            {
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError,
            };

            return Results.Problem(
                title: error.Code,
                detail: error.Message,
                statusCode: status);
        })
        .WithName("Identity_DeleteAccount")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
