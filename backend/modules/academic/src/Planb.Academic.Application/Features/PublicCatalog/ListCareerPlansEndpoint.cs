using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/career-plans?careerId={id} — listado público de planes de una carrera.
///
/// Caller: dropdown 3 de la cascada del onboarding (US-037), después de elegir Carrera.
///
/// Devuelve TODOS los planes para que admin UIs futuras puedan reusar el endpoint. El status
/// viene como el enum <see cref="Planb.Academic.Domain.CareerPlans.CareerPlanStatus"/> serializado
/// por EF (Active | Deprecated). El cliente del onboarding filtra <c>Status == "Active"</c> para
/// no ofrecer planes históricos al alumno.
/// </summary>
public sealed class ListCareerPlansEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-plans", async (
            Guid? careerId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (careerId is null || careerId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_plans.missing_career_id",
                    detail: "careerId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var plans = await queries.ListCareerPlansByCareerAsync(careerId.Value, ct);
            return Results.Ok(plans);
        })
        .WithName("Academic_ListCareerPlans")
        .WithTags("Academic")
        .Produces<IReadOnlyList<CareerPlanListItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
