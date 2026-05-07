using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDeletionLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_deletion_log",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_deletion_log", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_user_deletion_log_email_hash",
                schema: "identity",
                table: "user_deletion_log",
                column: "email_hash");

            migrationBuilder.CreateIndex(
                name: "ix_user_deletion_log_user_id",
                schema: "identity",
                table: "user_deletion_log",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_deletion_log",
                schema: "identity");
        }
    }
}
