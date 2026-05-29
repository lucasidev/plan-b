using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialReviewsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "reviews");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.CreateTable(
                name: "reviews",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    enrollment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    docente_resenado_id = table.Column<Guid>(type: "uuid", nullable: false),
                    difficulty_rating = table.Column<short>(type: "smallint", nullable: false),
                    subject_text = table.Column<string>(type: "text", nullable: true),
                    teacher_text = table.Column<string>(type: "text", nullable: true),
                    final_grade = table.Column<decimal>(type: "numeric(4,2)", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reviews", x => x.id);
                    table.CheckConstraint("ck_reviews_at_least_one_text", "subject_text IS NOT NULL OR teacher_text IS NOT NULL");
                    table.CheckConstraint("ck_reviews_difficulty_rating_range", "difficulty_rating BETWEEN 1 AND 5");
                    table.CheckConstraint("ck_reviews_final_grade_range", "final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 10)");
                });

            migrationBuilder.CreateIndex(
                name: "ix_reviews_docente_resenado",
                schema: "reviews",
                table: "reviews",
                column: "docente_resenado_id");

            migrationBuilder.CreateIndex(
                name: "ux_reviews_enrollment",
                schema: "reviews",
                table: "reviews",
                column: "enrollment_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reviews",
                schema: "reviews");
        }
    }
}
