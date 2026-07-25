using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// GET /api/academic/subjects/{subjectId:guid}/commissions/admin?termId={id} (admin, US-093).
/// Listado del backoffice: comisiones activas + inactivas de esa materia+término, cada una con
/// docentes y horario. A diferencia del catálogo público
/// (<c>GET /api/academic/subjects/{id}/commissions</c>, AllowAnonymous, solo activas y sin horario),
/// este cuelga del sufijo <c>/admin</c> del mismo recurso para no colisionar con esa ruta. Gateado a
/// rol Admin.
/// </summary>
public sealed class ListCommissionsAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/subjects/{subjectId:guid}/commissions/admin", async (
            Guid subjectId,
            Guid? termId,
            IAdminCommissionReader reader,
            CancellationToken ct) =>
        {
            if (termId is null || termId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.commissions.missing_term_id",
                    detail: "termId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var items = await reader.ListBySubjectAndTermAsync(subjectId, termId.Value, ct);
            return Results.Ok(new AdminCommissionListResponse(items));
        })
        .WithName("Academic_ListCommissionsAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCommissionPolicy.RoleName))
        .Produces<AdminCommissionListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
