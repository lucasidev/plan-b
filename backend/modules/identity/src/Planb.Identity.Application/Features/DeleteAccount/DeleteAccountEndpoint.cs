using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.DeleteAccount;

/// <summary>
/// DELETE /api/me/account?userId={guid} (UC-038, Ley 25.326 art. 6).
///
/// **Auth gap (NO production-safe)**: el backend no tiene JwtBearer middleware, así que el
/// userId viaja en query string en lugar de derivarse del claim <c>sub</c> del JWT. Mismo
/// patrón temporal que <c>CreateStudentProfileEndpoint</c>. Mitigación operativa: solo se
/// alcanza vía la UI del frontend que extrae el UserId de la sesión firmada por iron-session.
/// Cuando JwtBearer aterrice, refactorizar para usar el claim y aplicar <c>RequireAuthorization()</c>.
///
/// Mapeo de errores:
/// <list type="bullet">
///   <item>UserId vacío o inválido (Guid.Empty / formato roto): 400.</item>
///   <item>User no encontrado (ya borrado, o never existió): 404 idempotent.</item>
///   <item>Cualquier otro error de dominio: 500 (no hay reglas de negocio que devuelvan 4xx
///     después del lookup; el delete es incondicional).</item>
///   <item>Happy path: 204 No Content.</item>
/// </list>
/// </summary>
public sealed class DeleteAccountEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/me/account", async (
            Guid? userId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (userId is null || userId.Value == Guid.Empty)
            {
                return Results.Problem(
                    title: "identity.user.invalid_id",
                    detail: "userId query parameter is required and must be a non-empty Guid.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            UserId typedId;
            try
            {
                typedId = new UserId(userId.Value);
            }
            catch (ArgumentException)
            {
                return Results.Problem(
                    title: "identity.user.invalid_id",
                    detail: "userId is invalid.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new DeleteAccountCommand(typedId);
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
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
