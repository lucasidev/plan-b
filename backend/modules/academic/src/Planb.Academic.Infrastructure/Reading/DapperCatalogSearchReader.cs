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
                    (academic.immutable_unaccent(lower(s.code)) = academic.immutable_unaccent(lower(@Term)))::int AS rank_exact,
                    (academic.immutable_unaccent(lower(s.code)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                        OR academic.immutable_unaccent(lower(s.name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%')::int AS rank_prefix,
                    GREATEST(similarity(academic.immutable_unaccent(lower(s.name)), academic.immutable_unaccent(lower(@Term))),
                             similarity(academic.immutable_unaccent(lower(s.code)), academic.immutable_unaccent(lower(@Term))))    AS sim
                FROM academic.subjects s
                WHERE s.is_active
                  AND (academic.immutable_unaccent(lower(s.code)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                   OR academic.immutable_unaccent(lower(s.name)) LIKE '%' || academic.immutable_unaccent(lower(@Term)) || '%'
                   OR academic.immutable_unaccent(lower(s.name)) % academic.immutable_unaccent(lower(@Term))
                   OR academic.immutable_unaccent(lower(s.code)) % academic.immutable_unaccent(lower(@Term)))

                UNION ALL

                SELECT
                    'teacher'                                       AS type,
                    t.id                                            AS id,
                    initcap(t.first_name || ' ' || t.last_name)     AS label,
                    COALESCE(t.title, '')                           AS sublabel,
                    0                                               AS rank_exact,
                    (academic.immutable_unaccent(lower(t.first_name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                        OR academic.immutable_unaccent(lower(t.last_name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                        OR academic.immutable_unaccent(lower(t.first_name || ' ' || t.last_name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%')::int
                                                                    AS rank_prefix,
                    GREATEST(similarity(academic.immutable_unaccent(lower(t.first_name)), academic.immutable_unaccent(lower(@Term))),
                             similarity(academic.immutable_unaccent(lower(t.last_name)), academic.immutable_unaccent(lower(@Term))),
                             similarity(academic.immutable_unaccent(lower(t.first_name || ' ' || t.last_name)), academic.immutable_unaccent(lower(@Term))))
                                                                    AS sim
                FROM academic.teachers t
                WHERE t.is_active
                  AND (academic.immutable_unaccent(lower(t.first_name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(t.last_name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(t.first_name || ' ' || t.last_name)) LIKE '%' || academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(t.first_name)) % academic.immutable_unaccent(lower(@Term))
                       OR academic.immutable_unaccent(lower(t.last_name)) % academic.immutable_unaccent(lower(@Term)))
            ) combined
            ORDER BY rank_exact DESC, rank_prefix DESC, sim DESC, label ASC
            LIMIT @Limit;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);

        // El umbral del operador `%` es una variable de sesión, no un literal del predicado. Se fija
        // acá porque `similarity(a, b) > 0.2` NO usa el índice trigram (solo el operador lo hace), y
        // con un solo predicado no indexable adentro del OR, todo el conjunto cae a seq scan. El 0.2
        // conserva el umbral que tenía la comparación anterior; el default de pg_trgm es 0.3, que
        // sería más estricto y cambiaría qué se encuentra.
        db.Open();
        await db.ExecuteAsync(new CommandDefinition(
            "SET pg_trgm.similarity_threshold = 0.2;", cancellationToken: ct));

        var rows = await db.QueryAsync<SearchResultItem>(
            new CommandDefinition(sql, new { Term = term, Limit = limit }, cancellationToken: ct));
        return rows.AsList();
    }
}
