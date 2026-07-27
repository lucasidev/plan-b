using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Moderation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResolvedReportChecks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "ck_review_reports_resolved_has_moderator_and_date",
                schema: "moderation",
                table: "review_reports",
                sql: "status = 'Open' OR (moderator_user_id IS NOT NULL AND resolved_at IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_review_reports_resolved_has_moderator_and_date",
                schema: "moderation",
                table: "review_reports");
        }
    }
}
