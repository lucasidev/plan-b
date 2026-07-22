using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/prerequisites?careerPlanId={id}: grafo público de correlativas de un plan
/// (los dos types juntos), para el grafo de correlativas de la landing. Sin auth.
///
/// <para>
/// No vive en <c>/api/academic/career-plans/{id}/prerequisites</c>: esa ruta ya la ocupa
/// <c>AdminPrerequisites/GetCareerPlanPrerequisitesEndpoint</c> (gateada a Admin, shape sin
/// code/name, consumida hoy por el backoffice de correlativas). Mismo template + verbo produce
/// <c>AmbiguousMatchException</c> en runtime (ver <see cref="AdminUniversities.ListUniversitiesAdminEndpoint"/>
/// para el precedente), así que este catálogo público usa query param, igual que
/// <see cref="ListCareersEndpoint"/> y <see cref="ListSubjectsEndpoint"/>.
/// </para>
///
/// Convención: si <c>careerPlanId</c> falta o no parsea como Guid, 400. Si parsea pero el plan no
/// existe o no tiene correlativas cargadas, lista vacía (200): mismo criterio que el resto del
/// catálogo público.
/// </summary>
public sealed class ListPublicPrerequisitesEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/prerequisites", async (
            Guid? careerPlanId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (careerPlanId is null || careerPlanId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.prerequisites.missing_career_plan_id",
                    detail: "careerPlanId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var edges = await queries.ListPrerequisitesByCareerPlanAsync(careerPlanId.Value, ct);
            return Results.Ok(edges);
        })
        .WithName("Academic_ListPublicPrerequisites")
        .WithTags("Academic")
        .Produces<IReadOnlyList<PublicPrerequisiteEdge>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
