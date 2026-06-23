using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.Search;

/// <summary>
/// GET /api/search?q=&amp;limit= : búsqueda léxica global de catálogo (US-004). Ruta global (no
/// <c>/api/academic/...</c>) porque es un surface de UX transversal (el ⌘K del topbar); el
/// endpoint vive en Academic porque hoy solo busca materias. Sin auth (catálogo público).
///
/// <para>
/// Hoy devuelve solo resultados <c>type=subject</c>. La rama docente (<c>type=teacher</c>) se
/// injerta en US-063 (no hay entidad Teacher todavía); el contrato ya está discriminado por
/// <c>type</c>, así que sumarla es aditivo, no rework.
/// </para>
///
/// <para>
/// Rate limit (AC US-004: 30/min por IP vía <c>IRateLimiter</c>) diferido: bajo valor pre-deploy,
/// se suma cuando el surface público quede expuesto.
/// </para>
/// </summary>
public sealed class SearchEndpoint : ICarterModule
{
    public const int MinQueryLength = 2;
    public const int DefaultLimit = 20;
    public const int MaxLimit = 50;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/search", async (
            string? q,
            int? limit,
            ISubjectSearchReader reader,
            CancellationToken ct) =>
        {
            var term = q?.Trim() ?? string.Empty;
            if (term.Length < MinQueryLength)
            {
                return Results.Problem(
                    title: "academic.search.query_too_short",
                    detail: $"Query must be at least {MinQueryLength} characters.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var take = Math.Clamp(limit ?? DefaultLimit, 1, MaxLimit);
            var items = await reader.SearchAsync(term, take, ct);
            return Results.Ok(new SearchResponse(items));
        })
        .WithName("Academic_Search")
        .WithTags("Academic")
        .Produces<SearchResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
