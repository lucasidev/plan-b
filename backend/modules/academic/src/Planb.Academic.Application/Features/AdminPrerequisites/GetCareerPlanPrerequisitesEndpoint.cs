using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// GET /api/academic/career-plans/{planId:guid}/prerequisites (admin, US-062). Grafo entero de
/// correlativas de un plan (los dos types juntos): el frontend usa esta única llamada para armar
/// las dos listas (para_cursar / para_rendir). Gateado a rol Admin.
/// </summary>
public sealed class GetCareerPlanPrerequisitesEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-plans/{planId:guid}/prerequisites", async (
            Guid planId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid pero CareerPlanId lo rechaza en su ctor:
            // cortamos acá para devolver 404 limpio (mismo criterio que los demás endpoints admin).
            if (planId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_plan.not_found",
                    detail: "Career plan not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var response = await bus.InvokeAsync<PrerequisiteGraphResponse>(
                new GetCareerPlanPrerequisitesQuery(planId), ct);
            return Results.Ok(response);
        })
        .WithName("Academic_GetCareerPlanPrerequisites")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminPrerequisitePolicy.RoleName))
        .Produces<PrerequisiteGraphResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
