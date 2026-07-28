using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <summary>
    /// <c>reviews.edited_at</c>: cuándo el autor editó el texto. Null si nunca lo hizo.
    /// </summary>
    /// <remarks>
    /// Nullable sin backfill a propósito. El feed lo usa para mostrar "editada", y las filas
    /// existentes no tienen cómo responder esa pregunta: <c>updated_at</c> no sirve porque lo
    /// mueven también la respuesta del docente y las transiciones de moderación, que es
    /// exactamente el bug que esta columna corrige. Derivarlo de ahí seria marcar como editadas
    /// reseñas que su autor nunca tocó, o sea el mismo error escrito en la base. Se puede
    /// reconstruir con precisión desde <c>reviews.review_audit_log</c> (acción <c>Edited</c>) el día
    /// que importe el histórico.
    /// </remarks>
    public partial class AddReviewEditedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "edited_at",
                schema: "reviews",
                table: "reviews",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "edited_at",
                schema: "reviews",
                table: "reviews");
        }
    }
}
