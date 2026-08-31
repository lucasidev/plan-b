using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingFilterIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_commissions_term",
                schema: "academic",
                table: "commissions",
                column: "term_id");

            migrationBuilder.CreateIndex(
                name: "ix_chair_members_teacher",
                schema: "academic",
                table: "chair_members",
                column: "teacher_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_commissions_term",
                schema: "academic",
                table: "commissions");

            migrationBuilder.DropIndex(
                name: "ix_chair_members_teacher",
                schema: "academic",
                table: "chair_members");
        }
    }
}
