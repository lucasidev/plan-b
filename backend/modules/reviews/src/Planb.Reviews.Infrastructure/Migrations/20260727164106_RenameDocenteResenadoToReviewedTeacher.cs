using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <summary>
    /// La única columna del schema que estaba en castellano pasa a inglés, junto con su índice.
    /// </summary>
    /// <remarks>
    /// La regla es dura y cross-cutting (código en inglés, comentarios en castellano), y esta era la
    /// excepción: <c>docente_resenado_id</c> con su propiedad de dominio <c>DocenteResenadoId</c>
    /// atravesaba dominio, EF config, queries Dapper, eventos de integración y hasta el contrato HTTP
    /// que consume el frontend. Se renombra ahora, antes del primer deploy, porque el costo de la
    /// excepción solo crece: cada consumidor nuevo la copia.
    /// </remarks>
    public partial class RenameDocenteResenadoToReviewedTeacher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "docente_resenado_id",
                schema: "reviews",
                table: "reviews",
                newName: "reviewed_teacher_id");

            migrationBuilder.RenameIndex(
                name: "ix_reviews_docente_resenado",
                schema: "reviews",
                table: "reviews",
                newName: "ix_reviews_reviewed_teacher");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "reviewed_teacher_id",
                schema: "reviews",
                table: "reviews",
                newName: "docente_resenado_id");

            migrationBuilder.RenameIndex(
                name: "ix_reviews_reviewed_teacher",
                schema: "reviews",
                table: "reviews",
                newName: "ix_reviews_docente_resenado");
        }
    }
}
