using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/subjects/{subjectId}/chairs: cátedras activas de una materia, cada una con su
/// titular vigente (US-196).
///
/// Caller: el picker de cátedra de Reseñar (elegir "cursé con Pérez" antes de calificar la
/// cursada). Sin auth, el catálogo es público. Materia inexistente o sin cátedras cargadas devuelve
/// 200 con lista vacía (no 404), que es el criterio de un catálogo público: no encontrar nada es
/// una respuesta, no un error.
/// </summary>
public sealed class GetSubjectChairsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/subjects/{subjectId:guid}/chairs", async (
            Guid subjectId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            var chairs = await queries.ListChairsBySubjectAsync(subjectId, ct);
            return Results.Ok(chairs);
        })
        .WithName("Academic_GetSubjectChairs")
        .WithTags("Academic")
        .Produces<IReadOnlyList<ChairListItem>>(StatusCodes.Status200OK)
        .AllowAnonymous();
    }
}
