using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/subjects/{subjectId}/commissions?termId={id}: comisiones de una materia en un
/// cuatrimestre, con sus docentes (US-065).
///
/// Caller: el picker de comisión al reseñar (elegir la cursada + ver el docente real) y la página
/// de materia. Sin auth, el catálogo es público. Misma convención que <see cref="ListSubjectsEndpoint"/>:
/// termId faltante o vacío devuelve 400; par sin oferta cargada devuelve 200 con lista vacía.
/// </summary>
public sealed class ListCommissionsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/subjects/{subjectId:guid}/commissions", async (
            Guid subjectId,
            Guid? termId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (termId is null || termId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.commissions.missing_term_id",
                    detail: "termId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var commissions = await queries.ListCommissionsBySubjectAndTermAsync(
                subjectId, termId.Value, ct);
            return Results.Ok(commissions);
        })
        .WithName("Academic_ListCommissions")
        .WithTags("Academic")
        .Produces<IReadOnlyList<CommissionListItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
