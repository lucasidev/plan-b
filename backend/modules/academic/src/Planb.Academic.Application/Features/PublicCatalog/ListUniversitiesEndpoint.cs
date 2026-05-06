using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/universities — listado público (sin auth) de universidades del catálogo.
///
/// Caller principal: dropdown 1 de la cascada del onboarding (US-037). El catálogo MVP tiene
/// pocas unis (4 seedeadas), no requiere paginación; cuando exceda ~50, agregar.
///
/// **Sin auth deliberadamente**: el catálogo es público (visitor en /sign-up puede ver qué unis
/// están soportadas antes de registrarse). No expone PII. La respuesta es deterministic — un
/// caché HTTP de cliente / CDN edge sería razonable cuando llegue, pero hoy es overkill.
///
/// Read directo via <see cref="IAcademicQueryService"/> (Dapper). No hay command, no hay
/// Wolverine handler — el patrón "endpoint → query service → DB" es el estándar para reads
/// simples en este monolito (ADR-0018).
/// </summary>
public sealed class ListUniversitiesEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/universities", async (
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            var universities = await queries.ListUniversitiesAsync(ct);
            return Results.Ok(universities);
        })
        .WithName("Academic_ListUniversities")
        .WithTags("Academic")
        .Produces<IReadOnlyList<UniversityListItem>>(StatusCodes.Status200OK)
        .AllowAnonymous();
    }
}
