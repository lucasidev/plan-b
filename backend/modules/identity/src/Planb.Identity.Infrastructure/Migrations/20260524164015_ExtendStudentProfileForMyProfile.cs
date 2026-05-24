using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExtendStudentProfileForMyProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "display_name",
                schema: "identity",
                table: "student_profiles",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "legajo",
                schema: "identity",
                table: "student_profiles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "regular_student",
                schema: "identity",
                table: "student_profiles",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "identity",
                table: "student_profiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "year_of_study",
                schema: "identity",
                table: "student_profiles",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "display_name",
                schema: "identity",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "legajo",
                schema: "identity",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "regular_student",
                schema: "identity",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "identity",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "year_of_study",
                schema: "identity",
                table: "student_profiles");
        }
    }
}
