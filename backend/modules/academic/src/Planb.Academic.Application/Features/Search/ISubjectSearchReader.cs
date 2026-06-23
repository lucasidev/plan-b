namespace Planb.Academic.Application.Features.Search;

/// <summary>
/// Read-side de la búsqueda léxica de catálogo (US-004). Hoy solo materias; la rama docente se
/// injerta en US-063 (no hay entidad Teacher todavía). Usa Postgres full-text + trigram (pg_trgm),
/// no pgvector (eso es la búsqueda semántica de reseñas, ADR-0007).
/// </summary>
public interface ISubjectSearchReader
{
    Task<IReadOnlyList<SearchResultItem>> SearchAsync(
        string term, int limit, CancellationToken ct = default);
}
