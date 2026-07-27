using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Planning.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDraftActiveUniqueAndVisibilityChecks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ux_simulation_drafts_owner_term_active",
                schema: "planning",
                table: "simulation_drafts",
                columns: new[] { "owner_profile_id", "term_id" },
                unique: true,
                filter: "status = 'Active'");

            migrationBuilder.AddCheckConstraint(
                name: "ck_simulation_drafts_private_has_no_shared_at",
                schema: "planning",
                table: "simulation_drafts",
                sql: "visibility <> 'Private' OR shared_at IS NULL");

            migrationBuilder.AddCheckConstraint(
                name: "ck_simulation_drafts_shared_requires_shared_at",
                schema: "planning",
                table: "simulation_drafts",
                sql: "visibility <> 'Shared' OR shared_at IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_simulation_drafts_owner_term_active",
                schema: "planning",
                table: "simulation_drafts");

            migrationBuilder.DropCheckConstraint(
                name: "ck_simulation_drafts_private_has_no_shared_at",
                schema: "planning",
                table: "simulation_drafts");

            migrationBuilder.DropCheckConstraint(
                name: "ck_simulation_drafts_shared_requires_shared_at",
                schema: "planning",
                table: "simulation_drafts");
        }
    }
}
