using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniversityProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "address",
                schema: "academic",
                table: "universities",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "locality_id",
                schema: "academic",
                table: "universities",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "locality_name",
                schema: "academic",
                table: "universities",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "logo",
                schema: "academic",
                table: "universities",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "logo_version",
                schema: "academic",
                table: "universities",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "province",
                schema: "academic",
                table: "universities",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "website",
                schema: "academic",
                table: "universities",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "province",
                schema: "academic",
                table: "academic_units",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "address",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "locality_id",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "locality_name",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "logo",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "logo_version",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "province",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "website",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "province",
                schema: "academic",
                table: "academic_units");

        }
    }
}
