using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PreserveLegacyTeacherNameDisplay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Antes de R7 el dominio bajaba estos campos a minúsculas y los reads aplicaban
            // initcap(). Conservamos esa representación publicada solo donde esa pérdida ya había
            // ocurrido; un valor con casing mixto puede ser una corrección editorial y no se toca.
            migrationBuilder.Sql(
                """
                UPDATE academic.teachers
                SET
                    first_name = CASE
                        WHEN first_name = lower(first_name) THEN initcap(first_name)
                        ELSE first_name
                    END,
                    last_name = CASE
                        WHEN last_name = lower(last_name) THEN initcap(last_name)
                        ELSE last_name
                    END
                WHERE first_name = lower(first_name) OR last_name = lower(last_name);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No se revierte: bajar a minúsculas destruiría el casing preservado y el que se
            // haya cargado o corregido después de aplicar la migración.
        }
    }
}
