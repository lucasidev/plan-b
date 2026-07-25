using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "commission_schedules",
                schema: "academic",
                columns: table => new
                {
                    day_of_week = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    commission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_commission_schedules", x => new { x.commission_id, x.day_of_week, x.start_time });
                    table.ForeignKey(
                        name: "FK_commission_schedules_commissions_commission_id",
                        column: x => x.commission_id,
                        principalSchema: "academic",
                        principalTable: "commissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "commission_schedules",
                schema: "academic");
        }
    }
}
