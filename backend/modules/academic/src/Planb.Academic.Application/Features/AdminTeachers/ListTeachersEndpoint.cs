using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// GET /api/academic/teachers (admin, US-063). Listado del backoffice: activos + inactivos, con
/// universidad y estado. Filtro opcional <c>?universityId=</c>. Gateado a rol Admin. El GET público
/// por id (<c>/api/academic/teachers/{id}</c>) vive aparte en PublicCatalog y no colisiona (ruta y
/// gating distintos).
/// </summary>
public sealed class ListTeachersEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/teachers", async (
            Guid? universityId,
            IAdminTeacherReader reader,
            CancellationToken ct) =>
        {
            var items = await reader.ListAsync(universityId, ct);
            return Results.Ok(new AdminTeacherListResponse(items));
        })
        .WithName("Academic_ListTeachers")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminTeacherPolicy.RoleName))
        .Produces<AdminTeacherListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
