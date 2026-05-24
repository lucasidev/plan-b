using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_settings",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    notifications_in_app = table.Column<bool>(type: "boolean", nullable: false),
                    notifications_email = table.Column<bool>(type: "boolean", nullable: false),
                    notify_review_response = table.Column<bool>(type: "boolean", nullable: false),
                    notify_new_review_in_followed = table.Column<bool>(type: "boolean", nullable: false),
                    notify_academic_calendar = table.Column<bool>(type: "boolean", nullable: false),
                    notify_draft_promotion_nudge = table.Column<bool>(type: "boolean", nullable: false),
                    show_display_name_in_reviews = table.Column<bool>(type: "boolean", nullable: false),
                    allow_teacher_contact = table.Column<bool>(type: "boolean", nullable: false),
                    language = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    theme = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ux_user_settings_user_id",
                schema: "identity",
                table: "user_settings",
                column: "user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_settings",
                schema: "identity");
        }
    }
}
