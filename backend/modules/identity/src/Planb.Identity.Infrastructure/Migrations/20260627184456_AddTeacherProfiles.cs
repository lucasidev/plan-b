using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "teacher_profiles",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_profiles", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ux_teacher_profiles_teacher_verified",
                schema: "identity",
                table: "teacher_profiles",
                column: "teacher_id",
                unique: true,
                filter: "verified_at IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ux_teacher_profiles_user_teacher",
                schema: "identity",
                table: "teacher_profiles",
                columns: new[] { "user_id", "teacher_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "teacher_profiles",
                schema: "identity");
        }
    }
}
