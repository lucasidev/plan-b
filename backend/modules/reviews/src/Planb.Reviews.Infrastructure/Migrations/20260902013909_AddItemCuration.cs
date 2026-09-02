using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddItemCuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "last_changed_by",
                schema: "reviews",
                table: "items",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "retired_at",
                schema: "reviews",
                table: "items",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "supersedes_item_id",
                schema: "reviews",
                table: "items",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_items_supersedes_item_id",
                schema: "reviews",
                table: "items",
                column: "supersedes_item_id");

            migrationBuilder.AddForeignKey(
                name: "FK_items_items_supersedes_item_id",
                schema: "reviews",
                table: "items",
                column: "supersedes_item_id",
                principalSchema: "reviews",
                principalTable: "items",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_items_items_supersedes_item_id",
                schema: "reviews",
                table: "items");

            migrationBuilder.DropIndex(
                name: "ix_items_supersedes_item_id",
                schema: "reviews",
                table: "items");

            migrationBuilder.DropColumn(
                name: "last_changed_by",
                schema: "reviews",
                table: "items");

            migrationBuilder.DropColumn(
                name: "retired_at",
                schema: "reviews",
                table: "items");

            migrationBuilder.DropColumn(
                name: "supersedes_item_id",
                schema: "reviews",
                table: "items");
        }
    }
}
