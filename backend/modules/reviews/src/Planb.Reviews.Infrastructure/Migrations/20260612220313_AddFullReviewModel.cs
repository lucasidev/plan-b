using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFullReviewModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "hours_per_week",
                schema: "reviews",
                table: "reviews",
                type: "smallint",
                nullable: true);

            // Backfill de rows legacy con el marcador "sin dato real" (US-089): 3 = mitad de
            // rango, dentro del CHECK 1-5. El default de EF habría sido 0, que viola el CHECK.
            // La app siempre escribe el valor real; este default solo cubre las rows previas.
            migrationBuilder.AddColumn<short>(
                name: "overall_rating",
                schema: "reviews",
                table: "reviews",
                type: "smallint",
                nullable: false,
                defaultValue: (short)3);

            migrationBuilder.AddColumn<string[]>(
                name: "tags",
                schema: "reviews",
                table: "reviews",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            // Backfill de rows legacy: true (la US-089 las trata como "recomendaría" por defecto;
            // no hay dato real para esas reseñas previas). La app siempre escribe el valor real.
            migrationBuilder.AddColumn<bool>(
                name: "would_recommend_course",
                schema: "reviews",
                table: "reviews",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "would_retake_teacher",
                schema: "reviews",
                table: "reviews",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_reviews_hours_per_week_range",
                schema: "reviews",
                table: "reviews",
                sql: "hours_per_week IS NULL OR (hours_per_week >= 0 AND hours_per_week <= 30)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_reviews_overall_rating_range",
                schema: "reviews",
                table: "reviews",
                sql: "overall_rating BETWEEN 1 AND 5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_reviews_hours_per_week_range",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropCheckConstraint(
                name: "ck_reviews_overall_rating_range",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "hours_per_week",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "overall_rating",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "tags",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "would_recommend_course",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "would_retake_teacher",
                schema: "reviews",
                table: "reviews");
        }
    }
}
