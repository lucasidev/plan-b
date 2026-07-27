using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <summary>
    /// <c>academic_terms.updated_at</c>, la única tabla del catálogo que no la tenía.
    /// </summary>
    /// <remarks>
    /// El <c>AddColumn</c> que genera EF para una columna NOT NULL nueva usa el default del tipo, o
    /// sea que todas las filas ya sembradas quedaban con fecha de edición 0001-01-01. Se agrega
    /// nullable, se rellena con <c>created_at</c> (que es la verdad: un período que nunca se editó
    /// se modificó por última vez cuando se creó) y recién ahí se marca NOT NULL.
    /// </remarks>
    public partial class AddAcademicTermUpdatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE academic.academic_terms ADD COLUMN updated_at timestamptz;");

            migrationBuilder.Sql(
                "UPDATE academic.academic_terms SET updated_at = created_at WHERE updated_at IS NULL;");

            migrationBuilder.Sql(
                "ALTER TABLE academic.academic_terms ALTER COLUMN updated_at SET NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "academic",
                table: "academic_terms");
        }
    }
}
