using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewVotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "review_votes",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false),
                    voter_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_helpful = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_review_votes", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_review_votes_review_id",
                schema: "reviews",
                table: "review_votes",
                column: "review_id");

            migrationBuilder.CreateIndex(
                name: "ux_review_votes_review_voter",
                schema: "reviews",
                table: "review_votes",
                columns: new[] { "review_id", "voter_user_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "review_votes",
                schema: "reviews");
        }
    }
}
