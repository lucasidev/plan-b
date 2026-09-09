using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicUnitsAndOfficialFacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "academic_units",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    university_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_units", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "official_facts",
                schema: "academic",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    field = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    period = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    source_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    source_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    source_document = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    source_retrieved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    derivation_rule_id = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    relieved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    relieved_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_official_facts", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_academic_units_university_id",
                schema: "academic",
                table: "academic_units",
                column: "university_id");

            migrationBuilder.CreateIndex(
                name: "ux_academic_units_university_slug",
                schema: "academic",
                table: "academic_units",
                columns: new[] { "university_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_official_facts_subject_field",
                schema: "academic",
                table: "official_facts",
                columns: new[] { "subject_type", "subject_id", "field" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "academic_units",
                schema: "academic");

            migrationBuilder.DropTable(
                name: "official_facts",
                schema: "academic");
        }
    }
}
