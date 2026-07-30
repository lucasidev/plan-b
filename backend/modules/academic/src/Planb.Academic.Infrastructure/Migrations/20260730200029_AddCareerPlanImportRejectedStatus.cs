using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCareerPlanImportRejectedStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "rejected_at",
                schema: "academic",
                table: "career_plan_imports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rejection_reason",
                schema: "academic",
                table: "career_plan_imports",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_career_plan_imports_rejected_has_reason",
                schema: "academic",
                table: "career_plan_imports",
                sql: "(status <> 'Rejected') OR (rejection_reason IS NOT NULL AND rejected_at IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_career_plan_imports_rejected_has_reason",
                schema: "academic",
                table: "career_plan_imports");

            migrationBuilder.DropColumn(
                name: "rejected_at",
                schema: "academic",
                table: "career_plan_imports");

            migrationBuilder.DropColumn(
                name: "rejection_reason",
                schema: "academic",
                table: "career_plan_imports");
        }
    }
}
