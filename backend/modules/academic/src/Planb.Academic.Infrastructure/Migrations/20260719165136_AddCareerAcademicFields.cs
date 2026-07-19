using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCareerAcademicFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "degree_type",
                schema: "academic",
                table: "careers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "academic",
                table: "careers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duration_years",
                schema: "academic",
                table: "careers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "modality",
                schema: "academic",
                table: "careers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "label",
                schema: "academic",
                table: "career_plans",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "degree_type",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "description",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "duration_years",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "modality",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "label",
                schema: "academic",
                table: "career_plans");
        }
    }
}
