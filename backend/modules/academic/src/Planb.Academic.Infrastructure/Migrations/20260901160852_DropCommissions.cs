using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropCommissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "commission_teachers",
                schema: "academic");

            migrationBuilder.DropTable(
                name: "commissions",
                schema: "academic");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "commissions",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    capacity = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    modality = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    schedules = table.Column<string>(type: "jsonb", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    term_id = table.Column<Guid>(type: "uuid", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_commissions", x => x.id);
                    table.CheckConstraint("ck_commissions_capacity_positive", "capacity IS NULL OR capacity > 0");
                });

            migrationBuilder.CreateTable(
                name: "commission_teachers",
                schema: "academic",
                columns: table => new
                {
                    commission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_commission_teachers", x => new { x.commission_id, x.teacher_id });
                    table.ForeignKey(
                        name: "FK_commission_teachers_commissions_commission_id",
                        column: x => x.commission_id,
                        principalSchema: "academic",
                        principalTable: "commissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_commissions_term",
                schema: "academic",
                table: "commissions",
                column: "term_id");

            migrationBuilder.CreateIndex(
                name: "ux_commissions_subject_term_name",
                schema: "academic",
                table: "commissions",
                columns: new[] { "subject_id", "term_id", "name" },
                unique: true);
        }
    }
}
