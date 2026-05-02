using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpiredAtToUserAndPartialUniqueEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_users_email",
                schema: "identity",
                table: "users");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "expired_at",
                schema: "identity",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ux_users_email_active",
                schema: "identity",
                table: "users",
                column: "email",
                unique: true,
                filter: "expired_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_users_email_active",
                schema: "identity",
                table: "users");

            migrationBuilder.DropColumn(
                name: "expired_at",
                schema: "identity",
                table: "users");

            migrationBuilder.CreateIndex(
                name: "ux_users_email",
                schema: "identity",
                table: "users",
                column: "email",
                unique: true);
        }
    }
}
