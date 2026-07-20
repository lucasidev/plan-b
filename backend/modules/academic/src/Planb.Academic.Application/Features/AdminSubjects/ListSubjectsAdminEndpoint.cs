using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain.CareerPlans;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// GET /api/academic/career-plans/{planId:guid}/subjects (admin, US-062). Listado del backoffice:
/// activas + inactivas de un plan, con todos los campos de detalle. Gateado a rol Admin.
///
/// <para>
/// A diferencia del catálogo público (<c>GET /api/academic/subjects?careerPlanId=</c>,
/// <c>AllowAnonymous</c>, solo activas), este cuelga de <c>/career-plans/{planId}/subjects</c>: son
/// templates distintos, no ambiguos, y no acoplan la pantalla de backoffice al contrato público.
/// </para>
/// </summary>
public sealed class ListSubjectsAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-plans/{planId:guid}/subjects", async (
            Guid planId,
            IAdminSubjectReader reader,
            CancellationToken ct) =>
        {
            if (planId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_plan.not_found",
                    detail: "Career plan not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var items = await reader.ListByCareerPlanAsync(new CareerPlanId(planId), ct);
            return Results.Ok(new AdminSubjectListResponse(items));
        })
        .WithName("Academic_ListSubjectsAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminSubjectPolicy.RoleName))
        .Produces<AdminSubjectListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
