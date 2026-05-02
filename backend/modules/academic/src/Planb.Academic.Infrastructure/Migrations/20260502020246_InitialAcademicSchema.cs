using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialAcademicSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "academic");

            migrationBuilder.CreateTable(
                name: "career_plans",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    career_id = table.Column<Guid>(type: "uuid", nullable: false),
                    year = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_career_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "careers",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    university_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_careers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "universities",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_universities", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_career_plans_career_id",
                schema: "academic",
                table: "career_plans",
                column: "career_id");

            migrationBuilder.CreateIndex(
                name: "ux_career_plans_career_year",
                schema: "academic",
                table: "career_plans",
                columns: new[] { "career_id", "year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_careers_university_id",
                schema: "academic",
                table: "careers",
                column: "university_id");

            migrationBuilder.CreateIndex(
                name: "ux_careers_university_slug",
                schema: "academic",
                table: "careers",
                columns: new[] { "university_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_universities_slug",
                schema: "academic",
                table: "universities",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "career_plans",
                schema: "academic");

            migrationBuilder.DropTable(
                name: "careers",
                schema: "academic");

            migrationBuilder.DropTable(
                name: "universities",
                schema: "academic");
        }
    }
}
