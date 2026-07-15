using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniversityAdminFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "academic",
                table: "universities",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "academic",
                table: "universities",
                type: "timestamp with time zone",
                nullable: true);

            // Backfill de las filas seedeadas antes de esta migración: no tenían updated_at, así
            // que arrancan iguales a created_at ("no editada desde que se creó"). De acá en
            // adelante el aggregate siempre manda un valor explícito (Create/Hydrate/Update), asi
            // que no hace falta un default a nivel columna.
            migrationBuilder.Sql(
                "UPDATE academic.universities SET updated_at = created_at WHERE updated_at IS NULL;");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "academic",
                table: "universities",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "academic",
                table: "universities");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "academic",
                table: "universities");
        }
    }
}
