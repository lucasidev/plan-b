using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// GET /api/academic/careers/{careerId:guid}/plans (admin, US-061). Listado del backoffice: todos
/// los planes de la carrera (Active + Deprecated), orden por year descendente. Gateado a rol Admin.
///
/// <para>
/// A diferencia del catálogo público (<c>GET /api/academic/career-plans?careerId=</c>,
/// <c>AllowAnonymous</c>, consumido por la cascada de onboarding US-037), este cuelga de
/// <c>/careers/{careerId}/plans</c>: son templates distintos, no ambiguos, y no acoplan la pantalla
/// de backoffice al contrato público.
/// </para>
/// </summary>
public sealed class ListCareerPlansAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/careers/{careerId:guid}/plans", async (
            Guid careerId,
            IAdminCareerPlanReader reader,
            CancellationToken ct) =>
        {
            if (careerId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career.not_found",
                    detail: "Career not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var items = await reader.ListByCareerAsync(new CareerId(careerId), ct);
            return Results.Ok(new AdminCareerPlanListResponse(items));
        })
        .WithName("Academic_ListCareerPlansAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPlanPolicy.RoleName))
        .Produces<AdminCareerPlanListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
