using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// GET /api/academic/universities/{universityId:guid}/terms (admin, US-064). Listado del
/// backoffice de los períodos lectivos de una universidad. Gateado a rol Admin.
///
/// <para>
/// A diferencia de <c>ListUniversitiesAdminEndpoint</c> (que necesita el segmento literal
/// <c>/admin</c> para no colisionar con el catálogo público), acá no hace falta: el catálogo
/// público de períodos vive en <c>GET /api/academic/academic-terms?universityId=</c> (ruta plana,
/// sin segmento de universidad), mientras que este endpoint cuelga de
/// <c>/universities/{universityId}/terms</c>. Son templates distintos, no ambiguos. Mismo patrón
/// que <c>ListCareersAdminEndpoint</c>.
/// </para>
/// </summary>
public sealed class ListAcademicTermsAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/universities/{universityId:guid}/terms", async (
            Guid universityId,
            IAdminAcademicTermReader reader,
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
            return Results.Ok(new AdminAcademicTermListResponse(items));
        })
        .WithName("Academic_ListAcademicTermsAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminAcademicTermPolicy.RoleName))
        .Produces<AdminAcademicTermListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
