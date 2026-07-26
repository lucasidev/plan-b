using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// GET /api/me/simulator/available (US-016).
///
/// Auth: JwtBearer middleware extrae el <c>UserId</c> del claim <c>sub</c>; <see cref="CurrentUser"/>
/// es el de Identity.Application (Planning ya lo referencia para <c>IIdentityQueryService</c>, mismo
/// criterio que Enrollments/Reviews/Moderation: no lo duplicamos como Academic, que sí tiene que
/// porque referenciar Identity le cerraría un cycle).
///
/// <para>
/// Query param opcional <c>termId</c> (US-096): sin él, la respuesta es la de siempre y cada item
/// viaja con <c>commissions: []</c>. Con él, cada item suma la oferta de comisiones activas de ese
/// término para esa materia (docentes + horario), que el planificador usa para elegir comisión y
/// detectar choques (ver POST /api/me/simulator/evaluate). El AC original de US-016 ya pedía este
/// query param; se había diferido porque, hasta ahora, ningún dato de disponibilidad dependía del
/// término (ver el historial de este archivo).
/// </para>
/// </summary>
public sealed class GetAvailableSubjectsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/simulator/available", async (
            HttpContext http,
            Guid? termId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var result = await bus.InvokeAsync<Result<AvailableSubjectsResponse>>(
                new GetAvailableSubjectsQuery(userId.Value, termId), ct);

            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }

            var error = result.Error;
            var statusCode = error.Type switch
            {
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError,
            };
            return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
        })
        .WithName("Planning_GetAvailableSubjects")
        .WithTags("Planning")
        .RequireAuthorization()
        .Produces<AvailableSubjectsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
