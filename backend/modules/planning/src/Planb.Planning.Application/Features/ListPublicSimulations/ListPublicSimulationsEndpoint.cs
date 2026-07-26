using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// GET /api/simulations/public?careerPlanId=&amp;termId=&amp;cursor= (US-027). Feed de simulaciones
/// compartidas del mismo CareerPlan + AcademicTerm, anonimizado (nunca <c>ownerProfileId</c> ni
/// nada del autor). Requiere user autenticado con <c>StudentProfile</c> activo del mismo
/// <c>careerPlanId</c> pedido: el corpus público es para alumnos de esa carrera, no para
/// visitantes ni para mirar el plan de otro (ver <see cref="ListPublicSimulationsQueryHandler"/>).
///
/// <para>
/// <c>pageSize</c> es fijo en 20 (<see cref="ListPublicSimulationsQueryHandler.PageSize"/>), no un
/// query param: paginación cursor-based por <c>shared_at DESC</c>, no offset/page.
/// </para>
/// </summary>
public sealed class ListPublicSimulationsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/simulations/public", async (
            Guid careerPlanId,
            Guid termId,
            string? cursor,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var result = await bus.InvokeAsync<Result<ListPublicSimulationsResponse>>(
                new ListPublicSimulationsQuery(userId.Value, careerPlanId, termId, cursor), ct);
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
        .WithName("Planning_ListPublicSimulations")
        .WithTags("Planning")
        .RequireAuthorization()
        .Produces<ListPublicSimulationsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
