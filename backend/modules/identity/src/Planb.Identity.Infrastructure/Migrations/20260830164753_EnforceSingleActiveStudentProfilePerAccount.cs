using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnforceSingleActiveStudentProfilePerAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ix_student_profiles_user_id desaparece porque el índice único de abajo queda
            // sobre exactamente la misma columna (user_id): EF Core lo reconfigura en el mismo
            // objeto en lugar de crear uno aparte. Hoy no se pierde nada real: StudentProfileStatus
            // solo tiene el valor Active, así que el filtro parcial cubre el 100% de las filas
            // (ver StudentProfileStatus). Si en el futuro se agrega Inactive/Graduated y aparecen
            // cargas del aggregate que necesiten un índice sin filtrar por status, se revisa ahí.
            migrationBuilder.DropIndex(
                name: "ix_student_profiles_user_id",
                schema: "identity",
                table: "student_profiles");

            // Reemplaza el índice compuesto (user_id, career_id): el invariante pasó de "un
            // profile activo por carrera" a "un profile activo por cuenta" (bug real: dos
            // pestañas declarando carreras distintas en simultáneo dejaban dos profiles activos
            // y el read de "la" carrera del user quedaba indeterminado). En una base de dev con
            // filas que ya violan este índice nuevo (esa cuenta con dos profiles activos), este
            // CreateIndex falla al aplicarse: se resuelve con `just infra-reset`, no hace falta
            // una migración de datos para un bug que no debería tener filas válidas de por medio.
            migrationBuilder.DropIndex(
                name: "ux_student_profiles_user_career_active",
                schema: "identity",
                table: "student_profiles");

            migrationBuilder.CreateIndex(
                name: "ux_student_profiles_user_active",
                schema: "identity",
                table: "student_profiles",
                column: "user_id",
                unique: true,
                filter: "status = 'Active'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_student_profiles_user_active",
                schema: "identity",
                table: "student_profiles");

            migrationBuilder.CreateIndex(
                name: "ix_student_profiles_user_id",
                schema: "identity",
                table: "student_profiles",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ux_student_profiles_user_career_active",
                schema: "identity",
                table: "student_profiles",
                columns: new[] { "user_id", "career_id" },
                unique: true,
                filter: "status = 'Active'");
        }
    }
}
