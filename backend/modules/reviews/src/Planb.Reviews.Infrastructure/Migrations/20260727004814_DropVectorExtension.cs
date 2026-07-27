using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <summary>
    /// Saca la extensión <c>vector</c> (ADR-0007, revisión del 2026-07-26): el andamiaje de pgvector
    /// se borra hasta que exista un consumidor real.
    /// </summary>
    /// <remarks>
    /// El <c>AlterDatabase</c> que genera EF al quitar la anotación del modelo NO emite DDL. El script
    /// de esta migración era solo la fila del historial, así que la extensión quedaba instalada y el
    /// "se borró" del ADR habría sido falso. El <c>DROP</c> explícito es lo que lo hace verdad.
    ///
    /// <para>
    /// Es seguro: no hay ninguna columna de tipo <c>vector</c> en la base (verificado contra
    /// <c>pg_attribute</c>) y ningún otro DbContext declara la extensión. El <c>IF EXISTS</c> cubre la
    /// base que nunca la tuvo.
    /// </para>
    /// </remarks>
    public partial class DropVectorExtension : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.Sql("DROP EXTENSION IF EXISTS vector;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS vector;");
        }
    }
}
