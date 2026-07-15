using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// GET /api/academic/universities/admin (admin, US-060). Listado del backoffice: activas +
/// inactivas, con dominios institucionales y count de careers. Gateado a rol Admin.
///
/// <para>
/// <b>Por qué <c>/admin</c> y no la ruta desnuda</b> (a diferencia de
/// <c>ListTeachersEndpoint</c>, que sí vive en <c>GET /api/academic/teachers</c>): esa ruta ya la
/// ocupa el catálogo público (<c>PublicCatalog/ListUniversitiesEndpoint</c>,
/// <c>AllowAnonymous</c>, consumido hoy por el onboarding cascada US-037). Registrar un segundo
/// <c>MapGet</c> sobre el mismo template + verbo produce <c>AmbiguousMatchException</c> en
/// runtime, y mover la ruta pública rompería al frontend sin coordinación. <c>/admin</c> es un
/// segmento literal: no colisiona con <c>GET /api/academic/universities/{id:guid}</c> porque
/// "admin" no matchea el constraint <c>:guid</c>. Sigue viviendo bajo <c>/api/academic/...</c>,
/// no bajo un namespace global <c>/api/admin/...</c>.
/// </para>
/// </summary>
public sealed class ListUniversitiesAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/universities/admin", async (
            IAdminUniversityReader reader,
            CancellationToken ct) =>
        {
            var items = await reader.ListAsync(ct);
            return Results.Ok(new AdminUniversityListResponse(items));
        })
        .WithName("Academic_ListUniversitiesAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminUniversityPolicy.RoleName))
        .Produces<AdminUniversityListResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
