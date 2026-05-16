using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCareerPlanImportsAndIsOfficial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_official",
                schema: "academic",
                table: "subjects",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_official",
                schema: "academic",
                table: "careers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_official",
                schema: "academic",
                table: "career_plans",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "career_plan_imports",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    university_id = table.Column<Guid>(type: "uuid", nullable: false),
                    career_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    plan_year = table.Column<int>(type: "integer", nullable: false),
                    student_enrollment_year = table.Column<int>(type: "integer", nullable: false),
                    source_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    payload = table.Column<string>(type: "jsonb", nullable: true),
                    error = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    approved_career_plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    parsed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_career_plan_imports", x => x.id);
                    table.CheckConstraint("ck_career_plan_imports_approved_has_plan_id", "(status <> 'Approved') OR approved_career_plan_id IS NOT NULL");
                    table.CheckConstraint("ck_career_plan_imports_approved_timestamp", "(status <> 'Approved') OR approved_at IS NOT NULL");
                    table.CheckConstraint("ck_career_plan_imports_failed_has_error", "(status <> 'Failed') OR error IS NOT NULL");
                    table.CheckConstraint("ck_career_plan_imports_parsed_timestamp", "(status NOT IN ('Parsed','Approved')) OR parsed_at IS NOT NULL");
                });

            migrationBuilder.CreateIndex(
                name: "ix_career_plan_imports_uploaded_by",
                schema: "academic",
                table: "career_plan_imports",
                column: "uploaded_by_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "career_plan_imports",
                schema: "academic");

            migrationBuilder.DropColumn(
                name: "is_official",
                schema: "academic",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "is_official",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "is_official",
                schema: "academic",
                table: "career_plans");
        }
    }
}
