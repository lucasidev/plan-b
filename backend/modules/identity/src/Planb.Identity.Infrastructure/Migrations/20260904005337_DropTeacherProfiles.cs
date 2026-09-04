using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropTeacherProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "teacher_verification_tokens",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "teacher_profiles",
                schema: "identity");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "teacher_profiles",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    institutional_email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    verification_method = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_profiles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "teacher_verification_tokens",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    consumed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    invalidated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    issued_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    purpose = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    teacher_profile_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_verification_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_teacher_verification_tokens_teacher_profiles_teacher_profil~",
                        column: x => x.teacher_profile_id,
                        principalSchema: "identity",
                        principalTable: "teacher_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
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

            migrationBuilder.CreateIndex(
                name: "ix_teacher_verification_tokens_profile_id",
                schema: "identity",
                table: "teacher_verification_tokens",
                column: "teacher_profile_id");

            migrationBuilder.CreateIndex(
                name: "ux_teacher_verification_tokens_token",
                schema: "identity",
                table: "teacher_verification_tokens",
                column: "token",
                unique: true);
        }
    }
}
