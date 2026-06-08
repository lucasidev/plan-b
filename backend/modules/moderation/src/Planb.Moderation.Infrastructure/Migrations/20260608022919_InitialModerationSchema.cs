using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Moderation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialModerationSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "moderation");

            migrationBuilder.CreateTable(
                name: "review_reports",
                schema: "moderation",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reporter_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    details = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_review_reports", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_review_reports_review_status",
                schema: "moderation",
                table: "review_reports",
                columns: new[] { "review_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ux_review_reports_review_reporter",
                schema: "moderation",
                table: "review_reports",
                columns: new[] { "review_id", "reporter_user_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "review_reports",
                schema: "moderation");
        }
    }
}
