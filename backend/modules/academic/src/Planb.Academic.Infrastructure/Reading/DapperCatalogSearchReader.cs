using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.Search;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper read de la búsqueda de catálogo (US-004): materias + docentes en una sola lista rankeada.
/// Cada rama (subjects, teachers) calcula el mismo trío de ranking (exact > prefix > similitud
/// trigram) y se unen con UNION ALL; el ORDER BY corre sobre el conjunto combinado, así un docente
/// puede rankear por encima de una materia y viceversa según la relevancia, no por tipo.
///
/// Todo pasa por <c>unaccent()</c> (búsqueda insensible a acentos, clave en español: "veronica"
/// matchea "Verónica", "anal" matchea "Análisis"). El umbral <c>similarity &gt; 0.2</c> tolera typos.
/// El índice GIN trigram de subjects (migración AddSubjectSearchTrigram) cubre el lado materia; el
/// catálogo docente es chico (seq scan barato), un índice análogo se suma si crece.
/// </summary>
internal sealed class DapperCatalogSearchReader : ICatalogSearchReader
{
    private readonly string _connectionString;

    public DapperCatalogSearchReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperCatalogSearchReader.");
    }

    public async Task<IReadOnlyList<SearchResultItem>> SearchAsync(
        string term, int limit, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT type AS Type, id AS Id, label AS Label, sublabel AS Sublabel
            FROM (
                SELECT
                    'subject'                                       AS type,
                    s.id                                            AS id,
                    s.name                                          AS label,
                    s.code                                          AS sublabel,
                    (unaccent(lower(s.code)) = unaccent(lower(@Term)))::int AS rank_exact,
                    (unaccent(lower(s.code)) LIKE unaccent(lower(@Term)) || '%'
                        OR unaccent(s.name) ILIKE unaccent(@Term) || '%')::int AS rank_prefix,
                    GREATEST(similarity(unaccent(s.name), unaccent(@Term)),
                             similarity(unaccent(s.code), unaccent(@Term)))    AS sim
                FROM academic.subjects s
                WHERE s.is_active
                  AND (unaccent(lower(s.code)) LIKE unaccent(lower(@Term)) || '%'
                   OR unaccent(s.name) ILIKE '%' || unaccent(@Term) || '%'
                   OR similarity(unaccent(s.name), unaccent(@Term)) > 0.2
                   OR similarity(unaccent(s.code), unaccent(@Term)) > 0.2)

                UNION ALL

                SELECT
                    'teacher'                                       AS type,
                    t.id                                            AS id,
                    initcap(t.first_name || ' ' || t.last_name)     AS label,
                    COALESCE(t.title, '')                           AS sublabel,
                    0                                               AS rank_exact,
                    (unaccent(lower(t.first_name)) LIKE unaccent(lower(@Term)) || '%'
                        OR unaccent(lower(t.last_name)) LIKE unaccent(lower(@Term)) || '%'
                        OR unaccent(t.first_name || ' ' || t.last_name) ILIKE unaccent(@Term) || '%')::int
                                                                    AS rank_prefix,
                    GREATEST(similarity(unaccent(t.first_name), unaccent(@Term)),
                             similarity(unaccent(t.last_name), unaccent(@Term)),
                             similarity(unaccent(t.first_name || ' ' || t.last_name), unaccent(@Term)))
                                                                    AS sim
                FROM academic.teachers t
                WHERE t.is_active
                  AND (unaccent(lower(t.first_name)) LIKE unaccent(lower(@Term)) || '%'
                       OR unaccent(lower(t.last_name)) LIKE unaccent(lower(@Term)) || '%'
                       OR unaccent(t.first_name || ' ' || t.last_name) ILIKE '%' || unaccent(@Term) || '%'
                       OR similarity(unaccent(t.first_name), unaccent(@Term)) > 0.2
                       OR similarity(unaccent(t.last_name), unaccent(@Term)) > 0.2)
            ) combined
            ORDER BY rank_exact DESC, rank_prefix DESC, sim DESC, label ASC
            LIMIT @Limit;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<SearchResultItem>(
            new CommandDefinition(sql, new { Term = term, Limit = limit }, cancellationToken: ct));
        return rows.AsList();
    }
}
