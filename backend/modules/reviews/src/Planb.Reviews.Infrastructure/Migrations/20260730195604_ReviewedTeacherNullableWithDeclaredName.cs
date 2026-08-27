using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReviewedTeacherNullableWithDeclaredName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Decisión de la versión anterior del producto, retirada con ADR-0063: el id pasa a
            // nullable (la reseña puede nombrar un docente sin resolver). Relajar un NOT NULL a
            // nullable no pierde datos, así que no necesita backfill.
            migrationBuilder.AlterColumn<Guid>(
                name: "reviewed_teacher_id",
                schema: "reviews",
                table: "reviews",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            // Nullable primero, backfill, y recién después NOT NULL (mismo patrón que
            // AddReviewAuthorUserId). Para las filas existentes el nombre sale del Teacher al que ya
            // apuntan: es la mejor reconstrucción honesta de "lo que el alumno declaró" que se puede
            // hacer hoy, dado que todo publish hasta ahora llegó con un id ya resuelto de un picker.
            migrationBuilder.AddColumn<string>(
                name: "reviewed_teacher_name",
                schema: "reviews",
                table: "reviews",
                type: "text",
                nullable: true);

            // Teacher nunca se hard-deletea (soft delete via is_active, justo para no dejar
            // reseñas colgadas), así que todo reviewed_teacher_id preexistente tiene que resolver.
            // Si alguno no resuelve, cortamos ruidoso en vez de dejar la columna a medias con un
            // valor inventado: un nombre vacío violaría el invariante que esta misma migración
            // viene a establecer.
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    orphans int;
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'academic' AND table_name = 'teachers'
                    ) THEN
                        UPDATE reviews.reviews r
                           SET reviewed_teacher_name = initcap(t.first_name || ' ' || t.last_name)
                          FROM academic.teachers t
                         WHERE t.id = r.reviewed_teacher_id
                           AND r.reviewed_teacher_name IS NULL;
                    END IF;

                    SELECT count(*) INTO orphans
                      FROM reviews.reviews
                     WHERE reviewed_teacher_name IS NULL;

                    IF orphans > 0 THEN
                        RAISE EXCEPTION
                            'No se pudo resolver el nombre del docente de % resena(s): su Teacher no existe en academic.teachers. Resolve esas filas a mano antes de aplicar la migracion.',
                            orphans;
                    END IF;
                END $$;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "reviewed_teacher_name",
                schema: "reviews",
                table: "reviews",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "reviewed_teacher_name",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.AlterColumn<Guid>(
                name: "reviewed_teacher_id",
                schema: "reviews",
                table: "reviews",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
