using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <summary>
    /// Hace alcanzable el índice de búsqueda del catálogo, que hasta ahora no lo era, y le da uno a
    /// docentes, que no tenía ninguno.
    /// </summary>
    /// <remarks>
    /// <para>
    /// El índice viejo era <c>gin (name gin_trgm_ops, code gin_trgm_ops)</c> sobre las columnas
    /// crudas, mientras que todos los predicados de la query envuelven la columna en
    /// <c>unaccent(...)</c>. Postgres solo usa un índice cuando la expresión indexada coincide con la
    /// de la query, así que ese índice no servía a la única query que lo justificaba: cada búsqueda
    /// del catálogo era un seq scan con <c>similarity()</c> por fila.
    /// </para>
    /// <para>
    /// Y no era un descuido evitable: las dos sobrecargas de <c>unaccent</c> son <c>STABLE</c>, no
    /// <c>IMMUTABLE</c>, así que Postgres rechaza un índice sobre <c>unaccent(name)</c>. El índice
    /// sobre columnas crudas era lo único que se podía crear. Lo que estaba mal era el comentario que
    /// afirmaba que sostenía esas búsquedas.
    /// </para>
    /// <para>
    /// La salida estándar es envolver <c>unaccent</c> fijando el diccionario de forma explícita: con
    /// el diccionario fijo el resultado sí es determinístico, y ahí marcarla <c>IMMUTABLE</c> es
    /// correcto y no una mentira al planner. La query pasa a usar exactamente la misma expresión.
    /// </para>
    /// </remarks>
    public partial class AddImmutableUnaccentSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE OR REPLACE FUNCTION academic.immutable_unaccent(text)
                RETURNS text
                LANGUAGE sql
                IMMUTABLE
                STRICT
                PARALLEL SAFE
                AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
                """);

            migrationBuilder.Sql("DROP INDEX IF EXISTS academic.ix_subjects_search_trgm;");

            migrationBuilder.Sql(
                """
                CREATE INDEX ix_subjects_search_trgm ON academic.subjects USING gin (
                    academic.immutable_unaccent(lower(code)) gin_trgm_ops,
                    academic.immutable_unaccent(lower(name)) gin_trgm_ops
                );
                """);

            // Docentes no tenía índice de búsqueda: el autocomplete los recorría enteros con
            // similarity() por fila, igual que materias pero sin siquiera un índice inalcanzable.
            // El tercero cubre la búsqueda por nombre completo ("juan perez"), que es un predicado
            // sobre la concatenación y necesita su propia expresión indexada.
            migrationBuilder.Sql(
                """
                CREATE INDEX ix_teachers_search_trgm ON academic.teachers USING gin (
                    academic.immutable_unaccent(lower(first_name)) gin_trgm_ops,
                    academic.immutable_unaccent(lower(last_name)) gin_trgm_ops,
                    academic.immutable_unaccent(lower(first_name || ' ' || last_name)) gin_trgm_ops
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS academic.ix_teachers_search_trgm;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS academic.ix_subjects_search_trgm;");

            // Se restituye el índice original, aunque fuera inalcanzable para la query: el Down tiene
            // que dejar el schema como estaba, no como habría convenido.
            migrationBuilder.Sql(
                """
                CREATE INDEX ix_subjects_search_trgm ON academic.subjects
                USING gin (name gin_trgm_ops, code gin_trgm_ops);
                """);

            migrationBuilder.Sql("DROP FUNCTION IF EXISTS academic.immutable_unaccent(text);");
        }
    }
}
