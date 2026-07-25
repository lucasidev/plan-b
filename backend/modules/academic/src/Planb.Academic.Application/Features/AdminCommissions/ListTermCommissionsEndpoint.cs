using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// GET /api/academic/terms/{termId:guid}/commissions (admin, US-093 cont.). Listado global del
/// backoffice para la pantalla "Comisiones · cuatri": comisiones activas + inactivas de TODAS las
/// materias de ese término, cada una con su materia, docentes y horario. A diferencia de
/// <see cref="ListCommissionsAdminEndpoint"/> (una materia+término), este recurso cuelga de
/// AcademicTerm y es cross-materia. Gateado a rol Admin.
/// </summary>
public sealed class ListTermCommissionsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/terms/{termId:guid}/commissions", async (
            Guid termId,
            IAdminCommissionReader reader,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es sintácticamente válido) pero no
            // corresponde a ningún término real: cortamos acá para devolver 404 limpio. Un termId
            // bien formado que no existe en la DB sigue de largo y el reader devuelve lista vacía,
            // mismo criterio que el listado por materia.
            if (termId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.commissions.term_not_found",
                    detail: "Academic term not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var items = await reader.ListByTermAsync(termId, ct);
            return Results.Ok(new TermCommissionListResponse(items));
        })
        .WithName("Academic_ListTermCommissions")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCommissionPolicy.RoleName))
        .Produces<TermCommissionListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
