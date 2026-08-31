using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// GET /api/academic/chairs?subjectId= (admin, US-196). Las cátedras de una materia con su equipo,
/// archivadas incluidas: es la pantalla desde la que se carga y se corrige.
///
/// <para>
/// Cuelga de <c>/chairs</c> y no de <c>/subjects/{id}/chairs</c> porque esa ruta ya la ocupa el
/// listado público, que devuelve solo las activas con su titular vigente. Son dos representaciones
/// distintas del mismo conjunto, y mapear las dos al mismo path deja a ASP.NET sin poder elegir.
/// </para>
/// </summary>
public sealed class ListChairsBySubjectEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/chairs", async (
            Guid subjectId,
            IAdminChairReader chairs,
            CancellationToken ct) =>
        {
            var list = await chairs.ListBySubjectAsync(subjectId, ct);
            return Results.Ok(list);
        })
        .WithName("Academic_ListChairsBySubject")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminChairPolicy.RoleName))
        .Produces<IReadOnlyList<AdminChairListItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
