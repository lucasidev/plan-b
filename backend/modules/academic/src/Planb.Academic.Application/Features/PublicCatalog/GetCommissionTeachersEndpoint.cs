using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/commissions/{commissionId}/teachers: docentes de una comisión por id (US-065).
///
/// Caller: el picker de docente del editor de reseña (elegir a quién reseñar entre los docentes de
/// la comisión de la cursada). Sin auth, el catálogo es público. Comisión inexistente o sin
/// docentes devuelve 200 con lista vacía (no 404): el caller ya tiene un commissionId concreto de la
/// cursada, y una comisión sin docentes cargados es un dato válido, no un error.
/// </summary>
public sealed class GetCommissionTeachersEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/commissions/{commissionId:guid}/teachers", async (
            Guid commissionId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            var teachers = await queries.GetCommissionTeachersAsync(commissionId, ct);
            return Results.Ok(teachers);
        })
        .WithName("Academic_GetCommissionTeachers")
        .WithTags("Academic")
        .Produces<IReadOnlyList<CommissionTeacherItem>>(StatusCodes.Status200OK)
        .AllowAnonymous();
    }
}
