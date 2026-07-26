using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Planning.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSimulationDrafts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "planning");

            migrationBuilder.CreateTable(
                name: "simulation_drafts",
                schema: "planning",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    term_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    visibility = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    shared_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_simulation_drafts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "simulation_draft_items",
                schema: "planning",
                columns: table => new
                {
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    draft_id = table.Column<Guid>(type: "uuid", nullable: false),
                    commission_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_simulation_draft_items", x => new { x.draft_id, x.subject_id });
                    table.ForeignKey(
                        name: "FK_simulation_draft_items_simulation_drafts_draft_id",
                        column: x => x.draft_id,
                        principalSchema: "planning",
                        principalTable: "simulation_drafts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_simulation_drafts_owner_term_status",
                schema: "planning",
                table: "simulation_drafts",
                columns: new[] { "owner_profile_id", "term_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "simulation_draft_items",
                schema: "planning");

            migrationBuilder.DropTable(
                name: "simulation_drafts",
                schema: "planning");
        }
    }
}
