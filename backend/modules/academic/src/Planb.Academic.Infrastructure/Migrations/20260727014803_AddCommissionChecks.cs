using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionChecks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "ck_commissions_capacity_positive",
                schema: "academic",
                table: "commissions",
                sql: "capacity IS NULL OR capacity > 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_commission_schedules_end_after_start",
                schema: "academic",
                table: "commission_schedules",
                sql: "end_time > start_time");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_commissions_capacity_positive",
                schema: "academic",
                table: "commissions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_commission_schedules_end_after_start",
                schema: "academic",
                table: "commission_schedules");
        }
    }
}
