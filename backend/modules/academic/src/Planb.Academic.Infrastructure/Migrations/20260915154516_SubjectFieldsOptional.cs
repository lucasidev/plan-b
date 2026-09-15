using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SubjectFieldsOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects");

            migrationBuilder.AlterColumn<int>(
                name: "weekly_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "total_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "term_kind",
                schema: "academic",
                table: "subjects",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "code",
                schema: "academic",
                table: "subjects",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40);

            migrationBuilder.AddCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects",
                sql: "(term_kind IS NULL AND term_in_year IS NULL) OR (term_kind = 'FullYear' AND term_in_year IS NULL) OR (term_kind IS NOT NULL AND term_kind <> 'FullYear' AND term_in_year IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects");

            migrationBuilder.AlterColumn<int>(
                name: "weekly_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "total_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "term_kind",
                schema: "academic",
                table: "subjects",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "code",
                schema: "academic",
                table: "subjects",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40,
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects",
                sql: "(term_kind = 'FullYear' AND term_in_year IS NULL) OR (term_kind <> 'FullYear' AND term_in_year IS NOT NULL)");
        }
    }
}
