using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <summary>
    /// El aggregate reclama el nombre <c>Review</c> ahora que el modelo anterior no existe, y las
    /// tablas lo siguen.
    ///
    /// <para>
    /// Escrita a mano: EF la scaffoldeó como drop + create, que borra las filas. Un rename las
    /// preserva, y el corpus de desarrollo tiene que sobrevivir a un cambio de nombre.
    /// </para>
    /// </summary>
    /// <inheritdoc />
    public partial class RenameCourseReviewToReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_course_review_answers_course_reviews_course_review_id",
                schema: "reviews",
                table: "course_review_answers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_course_review_answers",
                schema: "reviews",
                table: "course_review_answers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_course_reviews",
                schema: "reviews",
                table: "course_reviews");

            migrationBuilder.RenameIndex(
                name: "ix_course_reviews_chair",
                newName: "ix_reviews_chair",
                schema: "reviews",
                table: "course_reviews");

            migrationBuilder.RenameIndex(
                name: "ux_course_reviews_account_subject_term",
                newName: "ux_reviews_account_subject_term",
                schema: "reviews",
                table: "course_reviews");

            migrationBuilder.RenameColumn(
                name: "course_review_id",
                schema: "reviews",
                table: "course_review_answers",
                newName: "review_id");

            migrationBuilder.RenameTable(
                name: "course_reviews",
                schema: "reviews",
                newName: "reviews",
                newSchema: "reviews");

            migrationBuilder.RenameTable(
                name: "course_review_answers",
                schema: "reviews",
                newName: "review_answers",
                newSchema: "reviews");

            migrationBuilder.AddPrimaryKey(
                name: "PK_reviews",
                schema: "reviews",
                table: "reviews",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_review_answers",
                schema: "reviews",
                table: "review_answers",
                columns: new[] { "review_id", "item_id" });

            migrationBuilder.AddForeignKey(
                name: "FK_review_answers_reviews_review_id",
                schema: "reviews",
                table: "review_answers",
                column: "review_id",
                principalSchema: "reviews",
                principalTable: "reviews",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_review_answers_reviews_review_id",
                schema: "reviews",
                table: "review_answers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_review_answers",
                schema: "reviews",
                table: "review_answers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_reviews",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.RenameTable(
                name: "review_answers",
                schema: "reviews",
                newName: "course_review_answers",
                newSchema: "reviews");

            migrationBuilder.RenameTable(
                name: "reviews",
                schema: "reviews",
                newName: "course_reviews",
                newSchema: "reviews");

            migrationBuilder.RenameColumn(
                name: "review_id",
                schema: "reviews",
                table: "course_review_answers",
                newName: "course_review_id");

            migrationBuilder.RenameIndex(
                name: "ix_reviews_chair",
                newName: "ix_course_reviews_chair",
                schema: "reviews",
                table: "course_reviews");

            migrationBuilder.RenameIndex(
                name: "ux_reviews_account_subject_term",
                newName: "ux_course_reviews_account_subject_term",
                schema: "reviews",
                table: "course_reviews");

            migrationBuilder.AddPrimaryKey(
                name: "PK_course_reviews",
                schema: "reviews",
                table: "course_reviews",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_course_review_answers",
                schema: "reviews",
                table: "course_review_answers",
                columns: new[] { "course_review_id", "item_id" });

            migrationBuilder.AddForeignKey(
                name: "FK_course_review_answers_course_reviews_course_review_id",
                schema: "reviews",
                table: "course_review_answers",
                column: "course_review_id",
                principalSchema: "reviews",
                principalTable: "course_reviews",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
