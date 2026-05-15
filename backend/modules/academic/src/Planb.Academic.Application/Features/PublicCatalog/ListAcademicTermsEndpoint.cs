using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/academic-terms?universityId={id} — listado de períodos lectivos de una uni.
///
/// Caller: select de term en el form de cargar historial (US-013-f). El alumno tiene su
/// <c>StudentProfile.universityId</c> implícito (derivado del plan); el frontend resuelve la
/// uni y la pasa acá.
///
/// Misma convención de errores que los otros endpoints del catálogo.
/// </summary>
public sealed class ListAcademicTermsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/academic-terms", async (
            Guid? universityId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (universityId is null || universityId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.academic_terms.missing_university_id",
                    detail: "universityId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var terms = await queries.ListAcademicTermsByUniversityAsync(universityId.Value, ct);
            return Results.Ok(terms);
        })
        .WithName("Academic_ListAcademicTerms")
        .WithTags("Academic")
        .Produces<IReadOnlyList<AcademicTermListItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
