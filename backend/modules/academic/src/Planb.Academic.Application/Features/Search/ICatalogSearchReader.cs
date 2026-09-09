namespace Planb.Academic.Application.Features.Search;

/// <summary>
/// Read-side de la búsqueda léxica de catálogo (US-004, US-132): materias, docentes, cátedras,
/// carreras e instituciones en una sola lista rankeada por relevancia (el front muestra una lista
/// plana, así que un docente y una materia se ordenan juntos, no en secciones separadas). Usa
/// Postgres unaccent + trigram (pg_trgm), no pgvector (eso es la búsqueda semántica de reseñas,
/// ADR-0007).
/// </summary>
public interface ICatalogSearchReader
{
    Task<IReadOnlyList<SearchResultItem>> SearchAsync(
        string term, int limit, CancellationToken ct = default);
}
