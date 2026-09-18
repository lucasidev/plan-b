using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUniversityStaffRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM identity.users
                        WHERE role = 'university_staff'::identity.user_role
                    ) THEN
                        RAISE EXCEPTION 'Cannot remove university_staff: identity.users still references the role.';
                    END IF;
                END
                $$;

                ALTER TABLE identity.users
                    ALTER COLUMN role TYPE text USING role::text;

                DROP TYPE identity.user_role;
                CREATE TYPE identity.user_role AS ENUM ('member', 'moderator', 'admin');

                ALTER TABLE identity.users
                    ALTER COLUMN role TYPE identity.user_role
                    USING role::identity.user_role;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TYPE identity.user_role ADD VALUE IF NOT EXISTS 'university_staff';",
                suppressTransaction: true);
        }
    }
}
