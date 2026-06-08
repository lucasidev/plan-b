using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_reviews_enrollment",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "deleted_at",
                schema: "reviews",
                table: "reviews",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_reason",
                schema: "reviews",
                table: "reviews",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ux_reviews_enrollment",
                schema: "reviews",
                table: "reviews",
                column: "enrollment_id",
                unique: true,
                filter: "status <> 'Deleted'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_reviews_enrollment",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "deleted_reason",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.CreateIndex(
                name: "ux_reviews_enrollment",
                schema: "reviews",
                table: "reviews",
                column: "enrollment_id",
                unique: true);
        }
    }
}
