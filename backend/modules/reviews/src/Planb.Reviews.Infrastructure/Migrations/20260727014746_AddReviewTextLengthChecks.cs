using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewTextLengthChecks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "ck_reviews_subject_text_length",
                schema: "reviews",
                table: "reviews",
                sql: "subject_text IS NULL OR char_length(subject_text) BETWEEN 50 AND 2000");

            migrationBuilder.AddCheckConstraint(
                name: "ck_reviews_teacher_text_length",
                schema: "reviews",
                table: "reviews",
                sql: "teacher_text IS NULL OR char_length(teacher_text) BETWEEN 50 AND 2000");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_reviews_subject_text_length",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropCheckConstraint(
                name: "ck_reviews_teacher_text_length",
                schema: "reviews",
                table: "reviews");
        }
    }
}
