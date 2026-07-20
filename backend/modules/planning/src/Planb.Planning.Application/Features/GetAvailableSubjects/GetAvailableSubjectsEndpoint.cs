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
/// Nota sobre <c>termId</c>: el AC original (US-016) pedía <c>?termId=</c> en la query string, pero
/// con el modelo actual el <c>AcademicTerm</c> no participa del cómputo de disponibilidad: esta
/// depende solo de correlativas para_cursar + historial del alumno, y ninguna de las dos cosas varía
/// según el término. Se omite a propósito en vez de agregarlo sin uso: un parámetro que no cambia la
/// respuesta es ceremonia que además miente (el caller asumiría que filtra algo). Si el simulador
/// necesita a futuro acotar por oferta de comisiones de un término puntual, se agrega ahí, con un
/// efecto real y su propio test.
/// </para>
/// </summary>
public sealed class GetAvailableSubjectsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/simulator/available", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var result = await bus.InvokeAsync<Result<AvailableSubjectsResponse>>(
                new GetAvailableSubjectsQuery(userId.Value), ct);

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
