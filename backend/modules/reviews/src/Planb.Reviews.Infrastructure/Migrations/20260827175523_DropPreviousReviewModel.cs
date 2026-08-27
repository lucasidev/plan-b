using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropPreviousReviewModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "review_audit_log",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "review_votes",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "teacher_responses",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "reviews",
                schema: "reviews");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "review_audit_log",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    changes = table.Column<string>(type: "jsonb", nullable: false),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    performed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_review_audit_log", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "review_votes",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_helpful = table.Column<bool>(type: "boolean", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    voter_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_review_votes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_reason = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    difficulty_rating = table.Column<short>(type: "smallint", nullable: false),
                    edited_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    enrollment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    final_grade = table.Column<decimal>(type: "numeric(4,2)", nullable: true),
                    hours_per_week = table.Column<short>(type: "smallint", nullable: true),
                    overall_rating = table.Column<short>(type: "smallint", nullable: false),
                    reviewed_teacher_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reviewed_teacher_name = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    subject_text = table.Column<string>(type: "text", nullable: true),
                    tags = table.Column<string[]>(type: "text[]", nullable: false),
                    teacher_text = table.Column<string>(type: "text", nullable: true),
                    under_review_reason = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    would_recommend_course = table.Column<bool>(type: "boolean", nullable: false),
                    would_retake_teacher = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reviews", x => x.id);
                    table.CheckConstraint("ck_reviews_at_least_one_text", "subject_text IS NOT NULL OR teacher_text IS NOT NULL");
                    table.CheckConstraint("ck_reviews_difficulty_rating_range", "difficulty_rating BETWEEN 1 AND 5");
                    table.CheckConstraint("ck_reviews_final_grade_range", "final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 10)");
                    table.CheckConstraint("ck_reviews_hours_per_week_range", "hours_per_week IS NULL OR (hours_per_week >= 0 AND hours_per_week <= 30)");
                    table.CheckConstraint("ck_reviews_overall_rating_range", "overall_rating BETWEEN 1 AND 5");
                    table.CheckConstraint("ck_reviews_subject_text_length", "subject_text IS NULL OR char_length(subject_text) BETWEEN 50 AND 2000");
                    table.CheckConstraint("ck_reviews_teacher_text_length", "teacher_text IS NULL OR char_length(teacher_text) BETWEEN 50 AND 2000");
                });

            migrationBuilder.CreateTable(
                name: "teacher_responses",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text = table.Column<string>(type: "text", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_responses", x => x.id);
                    table.ForeignKey(
                        name: "FK_teacher_responses_reviews_review_id",
                        column: x => x.review_id,
                        principalSchema: "reviews",
                        principalTable: "reviews",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_review_audit_log_review_id_occurred_at",
                schema: "reviews",
                table: "review_audit_log",
                columns: new[] { "review_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "ix_review_votes_review_id",
                schema: "reviews",
                table: "review_votes",
                column: "review_id");

            migrationBuilder.CreateIndex(
                name: "ux_review_votes_review_voter",
                schema: "reviews",
                table: "review_votes",
                columns: new[] { "review_id", "voter_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reviews_author_user_id",
                schema: "reviews",
                table: "reviews",
                column: "author_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_reviewed_teacher",
                schema: "reviews",
                table: "reviews",
                column: "reviewed_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ux_reviews_enrollment",
                schema: "reviews",
                table: "reviews",
                column: "enrollment_id",
                unique: true,
                filter: "status <> 'Deleted'");

            migrationBuilder.CreateIndex(
                name: "ux_teacher_responses_review",
                schema: "reviews",
                table: "teacher_responses",
                column: "review_id",
                unique: true);
        }
    }
}
