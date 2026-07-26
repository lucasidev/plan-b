using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Reviews.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewAuthorUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Nullable primero, backfill, y recién después NOT NULL. EF genera esta columna con
            // `defaultValue: Guid.Empty`, y eso le pondría a cada reseña existente un autor que no
            // existe: exactamente el tipo de dato inventado que la columna viene a eliminar.
            migrationBuilder.AddColumn<Guid>(
                name: "author_user_id",
                schema: "reviews",
                table: "reviews",
                type: "uuid",
                nullable: true);

            // Backfill por el mismo camino que la columna reemplaza (reviews -> enrollment_records
            // -> student_profiles). Cruza schemas, que en runtime no haríamos (ADR-0017), pero una
            // migración de datos de una sola vez es justamente donde ese cruce corresponde: es el
            // último momento en que el dato viejo todavía se puede reconstruir.
            //
            // El guard de existencia de tablas no es defensivo de más: el orden en que se migran los
            // DbContext de cada módulo no está garantizado, así que en una base nueva esta migración
            // puede correr antes que las de identity y enrollments. Ahí no hay nada que backfillear
            // (la tabla de reseñas está vacía) y el UPDATE se saltea; PL/pgSQL no parsea el cuerpo
            // de un IF que no se ejecuta, así que tampoco falla por tabla inexistente.
            //
            // Si después del backfill queda alguna fila sin autor, es una reseña cuyo student_profile
            // ya fue borrado por una baja de cuenta. Ese dato no se puede reconstruir y no hay valor
            // honesto para inventarle, así que cortamos ruidoso en lugar de dejar la columna a medias.
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    orphans int;
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'enrollments' AND table_name = 'enrollment_records'
                    ) AND EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'identity' AND table_name = 'student_profiles'
                    ) THEN
                        UPDATE reviews.reviews r
                           SET author_user_id = sp.user_id
                          FROM enrollments.enrollment_records er
                          JOIN identity.student_profiles sp ON sp.id = er.student_profile_id
                         WHERE er.id = r.enrollment_id;
                    END IF;

                    SELECT count(*) INTO orphans
                      FROM reviews.reviews
                     WHERE author_user_id IS NULL;

                    IF orphans > 0 THEN
                        RAISE EXCEPTION
                            'No se pudo resolver el autor de % resena(s): su student_profile ya no existe (baja de cuenta previa a esta columna). Resolve esas filas a mano antes de aplicar la migracion.',
                            orphans;
                    END IF;
                END $$;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "author_user_id",
                schema: "reviews",
                table: "reviews",
                type: "uuid",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "ix_reviews_author_user_id",
                schema: "reviews",
                table: "reviews",
                column: "author_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_reviews_author_user_id",
                schema: "reviews",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "author_user_id",
                schema: "reviews",
                table: "reviews");
        }
    }
}
