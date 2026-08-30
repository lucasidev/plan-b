using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DeclareCareerAtRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "pending_career_id",
                schema: "identity",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "pending_career_plan_id",
                schema: "identity",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "enrollment_year",
                schema: "identity",
                table: "student_profiles",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "pending_career_id",
                schema: "identity",
                table: "users");

            migrationBuilder.DropColumn(
                name: "pending_career_plan_id",
                schema: "identity",
                table: "users");

            migrationBuilder.AlterColumn<int>(
                name: "enrollment_year",
                schema: "identity",
                table: "student_profiles",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
