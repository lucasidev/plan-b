using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCareerAdminFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "code",
                schema: "academic",
                table: "careers",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "academic",
                table: "careers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "short_name",
                schema: "academic",
                table: "careers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "academic",
                table: "careers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.CreateIndex(
                name: "ux_careers_university_code",
                schema: "academic",
                table: "careers",
                columns: new[] { "university_id", "code" },
                unique: true,
                filter: "code IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_careers_university_code",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "code",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "short_name",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "academic",
                table: "careers");
        }
    }
}
