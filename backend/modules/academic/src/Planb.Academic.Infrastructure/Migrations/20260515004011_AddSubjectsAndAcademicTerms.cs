using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectsAndAcademicTerms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "academic_terms",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    university_id = table.Column<Guid>(type: "uuid", nullable: false),
                    year = table.Column<int>(type: "integer", nullable: false),
                    number = table.Column<int>(type: "integer", nullable: false),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    enrollment_opens = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    enrollment_closes = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    label = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_terms", x => x.id);
                    table.CheckConstraint("ck_academic_terms_dates_order", "end_date > start_date");
                    table.CheckConstraint("ck_academic_terms_enrollment_window", "enrollment_closes > enrollment_opens");
                });

            migrationBuilder.CreateTable(
                name: "subjects",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    career_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    year_in_plan = table.Column<int>(type: "integer", nullable: false),
                    term_in_year = table.Column<int>(type: "integer", nullable: true),
                    term_kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    weekly_hours = table.Column<int>(type: "integer", nullable: false),
                    total_hours = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subjects", x => x.id);
                    table.CheckConstraint("ck_subjects_term_kind_year_consistency", "(term_kind = 'Anual' AND term_in_year IS NULL) OR (term_kind <> 'Anual' AND term_in_year IS NOT NULL)");
                });

            migrationBuilder.CreateIndex(
                name: "ix_academic_terms_university_id",
                schema: "academic",
                table: "academic_terms",
                column: "university_id");

            migrationBuilder.CreateIndex(
                name: "ux_academic_terms_uni_year_number_kind",
                schema: "academic",
                table: "academic_terms",
                columns: new[] { "university_id", "year", "number", "kind" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_subjects_career_plan_id",
                schema: "academic",
                table: "subjects",
                column: "career_plan_id");

            migrationBuilder.CreateIndex(
                name: "ux_subjects_plan_code",
                schema: "academic",
                table: "subjects",
                columns: new[] { "career_plan_id", "code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "academic_terms",
                schema: "academic");

            migrationBuilder.DropTable(
                name: "subjects",
                schema: "academic");
        }
    }
}
