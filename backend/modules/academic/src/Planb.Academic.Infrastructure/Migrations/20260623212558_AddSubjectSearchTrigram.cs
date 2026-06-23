using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectSearchTrigram : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // US-004: búsqueda léxica de catálogo con tolerancia a typos. pg_trgm habilita
            // similarity() y los operadores de similitud; el índice GIN trigram sobre (name, code)
            // sostiene esas búsquedas y los LIKE/ILIKE prefijo. SQL crudo porque el operator class
            // gin_trgm_ops no se expresa en el fluent config de EF.
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
            // unaccent: búsqueda insensible a acentos ("analisis" matchea "Análisis"), clave en un
            // catálogo en español. La usa el read en WHERE/ORDER BY (no indexada: a 15 materias el
            // seq scan es instantáneo; a escala iría un expression index con wrapper IMMUTABLE).
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS unaccent;");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS ix_subjects_search_trgm " +
                "ON academic.subjects USING gin (name gin_trgm_ops, code gin_trgm_ops);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS academic.ix_subjects_search_trgm;");
            // La extensión pg_trgm se deja: puede haber otros índices/queries que la usen.
        }
    }
}
