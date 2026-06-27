using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherProfileVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "institutional_email",
                schema: "identity",
                table: "teacher_profiles",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "verification_method",
                schema: "identity",
                table: "teacher_profiles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "teacher_verification_tokens",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    purpose = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    issued_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    consumed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    invalidated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "teacher_verification_tokens",
                schema: "identity");

            migrationBuilder.DropColumn(
                name: "institutional_email",
                schema: "identity",
                table: "teacher_profiles");

            migrationBuilder.DropColumn(
                name: "verification_method",
                schema: "identity",
                table: "teacher_profiles");
        }
    }
}
