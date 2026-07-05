using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Moderation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReportResolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "moderator_user_id",
                schema: "moderation",
                table: "review_reports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "resolution_note",
                schema: "moderation",
                table: "review_reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "resolved_at",
                schema: "moderation",
                table: "review_reports",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "moderator_user_id",
                schema: "moderation",
                table: "review_reports");

            migrationBuilder.DropColumn(
                name: "resolution_note",
                schema: "moderation",
                table: "review_reports");

            migrationBuilder.DropColumn(
                name: "resolved_at",
                schema: "moderation",
                table: "review_reports");
        }
    }
}
