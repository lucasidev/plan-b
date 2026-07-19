using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// GET /api/academic/universities/{universityId:guid}/careers (admin, US-061). Listado del
/// backoffice: activas + inactivas de una universidad, con el count de planes asociados. Gateado
/// a rol Admin.
///
/// <para>
/// A diferencia de <c>ListUniversitiesAdminEndpoint</c> (que necesita el segmento literal
/// <c>/admin</c> para no colisionar con el catálogo público), acá no hace falta: el catálogo
/// público de carreras vive en <c>GET /api/academic/careers?universityId=</c> (ruta plana, sin
/// segmento de universidad), mientras que este endpoint cuelga de
/// <c>/universities/{universityId}/careers</c>. Son templates distintos, no ambiguos.
/// </para>
/// </summary>
public sealed class ListCareersAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/universities/{universityId:guid}/careers", async (
            Guid universityId,
            IAdminCareerReader reader,
            CancellationToken ct) =>
        {
            if (universityId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.university.not_found",
                    detail: "University not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var items = await reader.ListByUniversityAsync(new UniversityId(universityId), ct);
            return Results.Ok(new AdminCareerListResponse(items));
        })
        .WithName("Academic_ListCareersAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPolicy.RoleName))
        .Produces<AdminCareerListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
