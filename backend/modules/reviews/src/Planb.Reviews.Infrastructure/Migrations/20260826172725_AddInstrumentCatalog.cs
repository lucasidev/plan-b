using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInstrumentCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "instruments",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    version = table.Column<short>(type: "smallint", nullable: false),
                    valid_from = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    valid_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_instruments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "items",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    text = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    help = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    layer = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    subject = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "instrument_items",
                schema: "reviews",
                columns: table => new
                {
                    item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    instrument_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_instrument_items", x => new { x.instrument_id, x.item_id });
                    table.ForeignKey(
                        name: "FK_instrument_items_instruments_instrument_id",
                        column: x => x.instrument_id,
                        principalSchema: "reviews",
                        principalTable: "instruments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "item_options",
                schema: "reviews",
                columns: table => new
                {
                    value = table.Column<short>(type: "smallint", nullable: false),
                    item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<short>(type: "smallint", nullable: false),
                    label = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    valence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_item_options", x => new { x.item_id, x.value });
                    table.ForeignKey(
                        name: "FK_item_options_items_item_id",
                        column: x => x.item_id,
                        principalSchema: "reviews",
                        principalTable: "items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_instruments_code_version",
                schema: "reviews",
                table: "instruments",
                columns: new[] { "code", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_items_code",
                schema: "reviews",
                table: "items",
                column: "code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "instrument_items",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "item_options",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "instruments",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "items",
                schema: "reviews");
        }
    }
}
