using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChairs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "chairs",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chairs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chair_members",
                schema: "academic",
                columns: table => new
                {
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    since_term_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chair_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    until_term_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chair_members", x => new { x.chair_id, x.teacher_id, x.since_term_id });
                    table.ForeignKey(
                        name: "FK_chair_members_chairs_chair_id",
                        column: x => x.chair_id,
                        principalSchema: "academic",
                        principalTable: "chairs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_chairs_subject_name",
                schema: "academic",
                table: "chairs",
                columns: new[] { "subject_id", "name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chair_members",
                schema: "academic");

            migrationBuilder.DropTable(
                name: "chairs",
                schema: "academic");
        }
    }
}
