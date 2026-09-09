using Dapper;
using Planb.Academic.Application.Features.Search;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper read de la búsqueda de catálogo (US-004, US-132): materias, docentes, cátedras, carreras
/// e instituciones en una sola lista rankeada. Cada rama calcula el mismo trío de ranking
/// (exact > prefix > similitud trigram) y se unen con UNION ALL; el ORDER BY corre sobre el
/// conjunto combinado, así un docente puede rankear por encima de una materia y viceversa según la
/// relevancia, no por tipo.
///
/// <para>
/// La rama de cátedras existe porque la cátedra es el sujeto de lo que el producto publica
/// (ADR-0083): buscar un apellido tiene que poder llevar a lo que se dice de cursar con esa
/// cátedra, no solo a la persona. Su sublabel es la materia que dicta, que es lo que distingue a
/// dos cátedras con el mismo apellido.
/// </para>
///
/// <para>
/// Las ramas de carrera e institución (US-132, hallazgo V04: "buscar la carrera que uno quiere
/// estudiar devuelve materias") resuelven un sujeto que hoy no tiene código propio para un exact
/// match, salvo la institución por su slug: "unsta" matchea "UNSTA" exacto. La carrera es siempre
/// una carrera EN una institución (su sublabel es el nombre de la universidad), porque la misma
/// carrera existe en más de una institución y cada oferta tiene su propia ficha.
/// </para>
///
/// Todo pasa por <c>unaccent()</c> (búsqueda insensible a acentos, clave en español: "veronica"
/// matchea "Verónica", "anal" matchea "Análisis"). El umbral <c>similarity &gt; 0.2</c> tolera typos.
/// El índice GIN trigram de subjects (migración AddSubjectSearchTrigram) cubre el lado materia; los
/// catálogos de docentes, carreras e instituciones son chicos (seq scan barato), un índice análogo
/// se suma si crecen.
/// </summary>
internal sealed class DapperCatalogSearchReader : ICatalogSearchReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperCatalogSearchReader(IDbConnectionFactory connections) =>
        _connections = connections;

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

                UNION ALL

                SELECT
                    'chair'                                         AS type,
                    c.id                                            AS id,
                    c.name                                          AS label,
                    sub.name                                        AS sublabel,
                    0                                               AS rank_exact,
                    (academic.immutable_unaccent(lower(c.name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%')::int
                                                                    AS rank_prefix,
                    similarity(academic.immutable_unaccent(lower(c.name)), academic.immutable_unaccent(lower(@Term)))
                                                                    AS sim
                FROM academic.chairs c
                JOIN academic.subjects sub ON sub.id = c.subject_id
                WHERE c.is_active
                  AND sub.is_active
                  AND (academic.immutable_unaccent(lower(c.name)) LIKE '%' || academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(c.name)) % academic.immutable_unaccent(lower(@Term)))

                UNION ALL

                SELECT
                    'career'                                        AS type,
                    cr.id                                           AS id,
                    cr.name                                         AS label,
                    uni.name                                        AS sublabel,
                    (cr.code IS NOT NULL
                        AND academic.immutable_unaccent(lower(cr.code)) = academic.immutable_unaccent(lower(@Term)))::int
                                                                    AS rank_exact,
                    (academic.immutable_unaccent(lower(cr.name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%')::int
                                                                    AS rank_prefix,
                    similarity(academic.immutable_unaccent(lower(cr.name)), academic.immutable_unaccent(lower(@Term)))
                                                                    AS sim
                FROM academic.careers cr
                JOIN academic.universities uni ON uni.id = cr.university_id
                WHERE cr.is_active
                  AND uni.is_active
                  AND (academic.immutable_unaccent(lower(cr.name)) LIKE '%' || academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(cr.name)) % academic.immutable_unaccent(lower(@Term))
                       OR (cr.code IS NOT NULL
                           AND academic.immutable_unaccent(lower(cr.code)) = academic.immutable_unaccent(lower(@Term))))

                UNION ALL

                SELECT
                    'institution'                                   AS type,
                    u.id                                            AS id,
                    u.name                                          AS label,
                    ''::text                                        AS sublabel,
                    (academic.immutable_unaccent(lower(u.slug)) = academic.immutable_unaccent(lower(@Term)))::int
                                                                    AS rank_exact,
                    (academic.immutable_unaccent(lower(u.slug)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                        OR academic.immutable_unaccent(lower(u.name)) LIKE academic.immutable_unaccent(lower(@Term)) || '%')::int
                                                                    AS rank_prefix,
                    GREATEST(similarity(academic.immutable_unaccent(lower(u.name)), academic.immutable_unaccent(lower(@Term))),
                             similarity(academic.immutable_unaccent(lower(u.slug)), academic.immutable_unaccent(lower(@Term))))
                                                                    AS sim
                FROM academic.universities u
                WHERE u.is_active
                  AND (academic.immutable_unaccent(lower(u.name)) LIKE '%' || academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(u.slug)) LIKE academic.immutable_unaccent(lower(@Term)) || '%'
                       OR academic.immutable_unaccent(lower(u.name)) % academic.immutable_unaccent(lower(@Term))
                       OR academic.immutable_unaccent(lower(u.slug)) % academic.immutable_unaccent(lower(@Term)))
            ) combined
            ORDER BY rank_exact DESC, rank_prefix DESC, sim DESC, label ASC
            LIMIT @Limit;";

        using var db = _connections.Create();

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
