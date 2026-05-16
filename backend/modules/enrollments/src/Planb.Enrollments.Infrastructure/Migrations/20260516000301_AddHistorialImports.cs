using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Enrollments.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHistorialImports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "historial_imports",
                schema: "enrollments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    raw_payload = table.Column<string>(type: "jsonb", nullable: true),
                    error = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    parsed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historial_imports", x => x.id);
                    table.CheckConstraint("ck_historial_imports_confirmed_timestamp", "(status <> 'Confirmed') OR confirmed_at IS NOT NULL");
                    table.CheckConstraint("ck_historial_imports_failed_has_error", "(status <> 'Failed') OR error IS NOT NULL");
                    table.CheckConstraint("ck_historial_imports_parsed_timestamp", "(status NOT IN ('Parsed','Confirmed')) OR parsed_at IS NOT NULL");
                });

            migrationBuilder.CreateIndex(
                name: "ix_historial_imports_student",
                schema: "enrollments",
                table: "historial_imports",
                column: "student_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "historial_imports",
                schema: "enrollments");
        }
    }
}
