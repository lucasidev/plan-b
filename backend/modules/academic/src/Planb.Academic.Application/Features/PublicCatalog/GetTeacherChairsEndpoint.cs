using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/teachers/{teacherId}/chairs: las cátedras que un docente integra o integró,
/// con la materia de cada una (US-132).
///
/// Es el camino de la persona al sujeto: lo que el producto publica es de la cátedra y no del
/// docente (ADR-0083), así que su ficha tiene que poder llevar ahí. Sin auth, el catálogo es
/// público. Docente inexistente o sin cátedras devuelve 200 con lista vacía, mismo criterio que el
/// resto del catalogo.
/// </summary>
public sealed class GetTeacherChairsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/teachers/{teacherId:guid}/chairs", async (
            Guid teacherId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            var chairs = await queries.ListChairsByTeacherAsync(teacherId, ct);
            return Results.Ok(chairs);
        })
        .WithName("Academic_GetTeacherChairs")
        .WithTags("Academic")
        .Produces<IReadOnlyList<TeacherChairItem>>(StatusCodes.Status200OK)
        .AllowAnonymous();
    }
}
