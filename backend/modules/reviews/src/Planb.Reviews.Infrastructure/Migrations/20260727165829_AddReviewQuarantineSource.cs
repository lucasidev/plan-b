using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <summary>
    /// Distingue en la fila por qué una reseña quedó <c>UnderReview</c>: filtro de contenido o
    /// threshold de reports. Motivo en <c>Review.QuarantinedByContentFilter</c>.
    /// </summary>
    /// <remarks>
    /// El default <c>false</c> es deliberado también para las filas que ya están UnderReview: de
    /// dónde salió esa cuarentena no quedó registrado en ningún lado, así que reconstruirlo sería
    /// inventarlo. False las deja con el comportamiento que ya tenían (un report desestimado las
    /// republica), que es lo conservador: el cambio de semántica aplica de acá en adelante y no
    /// deja contenido viejo trabado de golpe.
    /// </remarks>
    public partial class AddReviewQuarantineSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "quarantined_by_content_filter",
                schema: "reviews",
                table: "reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "quarantined_by_content_filter",
                schema: "reviews",
                table: "reviews");
        }
    }
}
