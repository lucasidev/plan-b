using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPrerequisitesAndSubjectSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "academic",
                table: "subjects",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            // updated_at se agrega nullable y se backfillea desde created_at para las filas
            // existentes (no queremos dejarlas en epoch 0001-01-01); recién después se vuelve
            // NOT NULL.
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "academic",
                table: "subjects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE academic.subjects SET updated_at = created_at WHERE updated_at IS NULL;");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "academic",
                table: "subjects",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "prerequisites",
                schema: "academic",
                columns: table => new
                {
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    required_subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prerequisites", x => new { x.subject_id, x.required_subject_id, x.type });
                    table.CheckConstraint("ck_prerequisites_no_self_reference", "subject_id <> required_subject_id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_prerequisites_required_subject_id",
                schema: "academic",
                table: "prerequisites",
                column: "required_subject_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "prerequisites",
                schema: "academic");

            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "academic",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "academic",
                table: "subjects");
        }
    }
}
