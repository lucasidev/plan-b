using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicUnitAddressAndCareerLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "academic_unit_id",
                schema: "academic",
                table: "careers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "address",
                schema: "academic",
                table: "academic_units",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "locality_id",
                schema: "academic",
                table: "academic_units",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "locality_name",
                schema: "academic",
                table: "academic_units",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_careers_academic_unit_id",
                schema: "academic",
                table: "careers",
                column: "academic_unit_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_careers_academic_unit_id",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "academic_unit_id",
                schema: "academic",
                table: "careers");

            migrationBuilder.DropColumn(
                name: "address",
                schema: "academic",
                table: "academic_units");

            migrationBuilder.DropColumn(
                name: "locality_id",
                schema: "academic",
                table: "academic_units");

            migrationBuilder.DropColumn(
                name: "locality_name",
                schema: "academic",
                table: "academic_units");
        }
    }
}
