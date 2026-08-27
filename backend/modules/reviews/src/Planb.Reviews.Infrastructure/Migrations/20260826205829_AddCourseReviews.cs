using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "course_reviews",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    term_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chair_id = table.Column<Guid>(type: "uuid", nullable: true),
                    instrument_id = table.Column<Guid>(type: "uuid", nullable: false),
                    free_text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_reviews", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "course_review_answers",
                schema: "reviews",
                columns: table => new
                {
                    item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    course_review_id = table.Column<Guid>(type: "uuid", nullable: false),
                    option_value = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_review_answers", x => new { x.course_review_id, x.item_id });
                    table.ForeignKey(
                        name: "FK_course_review_answers_course_reviews_course_review_id",
                        column: x => x.course_review_id,
                        principalSchema: "reviews",
                        principalTable: "course_reviews",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_course_reviews_account_subject_term",
                schema: "reviews",
                table: "course_reviews",
                columns: new[] { "account_id", "subject_id", "term_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "course_review_answers",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "course_reviews",
                schema: "reviews");
        }
    }
}
