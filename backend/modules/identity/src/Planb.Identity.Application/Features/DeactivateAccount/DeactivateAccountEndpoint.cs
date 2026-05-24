using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.DeactivateAccount;

/// <summary>
/// DELETE /api/me/account (ADR-0044). User-facing flow del cierre de cuenta. El path se mantiene
/// estable (el frontend feature solo cambia su mapping interno) pero el comportamiento es soft
/// delete con anonimización en lugar del hard delete previo.
///
/// <para>
/// Mapeo de errores específicos:
/// </para>
/// <list type="bullet">
///   <item><c>identity.user.not_found</c> → 404 (user no existe, ya borrado o nunca existió).</item>
///   <item><c>identity.account.already_deactivated</c> → 409 (idempotency explícita).</item>
/// </list>
/// </summary>
public sealed class DeactivateAccountEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/me/account", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var result = await bus.InvokeAsync<Result>(new DeactivateAccountCommand(userId), ct);

            if (result.IsSuccess)
            {
                return Results.NoContent();
            }

            return ToProblem(result.Error);
        })
        .WithName("Identity_DeactivateAccount")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.NotFound => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status404NotFound),
        ErrorType.Conflict => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status409Conflict),
        ErrorType.Validation => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ErrorType.Unauthorized => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status401Unauthorized),
        ErrorType.Forbidden => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status403Forbidden),
        _ => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status500InternalServerError),
    };
}
