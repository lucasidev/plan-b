using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveVerificationTokenUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ux_verification_tokens_user_purpose_active",
                schema: "identity",
                table: "verification_tokens",
                columns: new[] { "user_id", "purpose" },
                unique: true,
                filter: "consumed_at IS NULL AND invalidated_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_verification_tokens_user_purpose_active",
                schema: "identity",
                table: "verification_tokens");
        }
    }
}
