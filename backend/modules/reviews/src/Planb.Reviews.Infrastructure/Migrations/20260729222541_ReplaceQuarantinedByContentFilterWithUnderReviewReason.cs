using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <summary>
    /// Reemplaza <c>quarantined_by_content_filter</c> (bool) por <c>under_review_reason</c> (enum
    /// persistido como text, mismo patrón que <c>status</c> y <c>deleted_reason</c>): el bool solo
    /// distinguía dos causas de <c>UnderReview</c> y no dejaba lugar para la tercera (invalidación
    /// por cambio de cursada, ADR-0032). Ver <c>Planb.Reviews.Domain.Reviews.UnderReviewReason</c>.
    /// </summary>
    /// <remarks>
    /// El orden importa: se agrega la columna nueva, se backfillea desde la vieja, y recién
    /// después se dropea el bool (al revés se pierde la información antes de poder migrarla).
    /// Backfill: <c>UnderReview</c> + bool <c>true</c> pasa a razón <c>ContentFilter</c>;
    /// <c>UnderReview</c> + bool <c>false</c> pasa a razón <c>Reports</c>; cualquier otro status
    /// queda <c>NULL</c> (ya lo estaba: el bool original tenía default <c>false</c> para esas
    /// filas, que no representaba ninguna de las dos causas).
    ///
    /// <see cref="Down"/> revierte el schema pero <b>pierde información</b>, y no puede no
    /// perderla: tres razones no entran en un bool. Una reseña con razón <c>EnrollmentChanged</c>
    /// vuelve como <c>false</c>, o sea que un <c>Up</c> posterior la leería como <c>Reports</c> y un
    /// moderador que desestime un reporte la republicaría hablando de una cursada que ya cambió. Si
    /// hay que rollbackear con filas en ese estado, exportarlas antes (ver
    /// <c>docs/engineering/rollback.md</c>).
    /// </remarks>
    public partial class ReplaceQuarantinedByContentFilterWithUnderReviewReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "under_review_reason",
                schema: "reviews",
                table: "reviews",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE reviews.reviews SET under_review_reason = 'ContentFilter' " +
                "WHERE status = 'UnderReview' AND quarantined_by_content_filter = true;");

            migrationBuilder.Sql(
                "UPDATE reviews.reviews SET under_review_reason = 'Reports' " +
                "WHERE status = 'UnderReview' AND quarantined_by_content_filter = false;");

            migrationBuilder.DropColumn(
                name: "quarantined_by_content_filter",
                schema: "reviews",
                table: "reviews");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "quarantined_by_content_filter",
                schema: "reviews",
                table: "reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                "UPDATE reviews.reviews SET quarantined_by_content_filter = true " +
                "WHERE under_review_reason = 'ContentFilter';");

            migrationBuilder.DropColumn(
                name: "under_review_reason",
                schema: "reviews",
                table: "reviews");
        }
    }
}
