using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Enrollments.Infrastructure.Migrations
{
    /// <summary>
    /// Aprobar cursando deja de exigir comisión en la base. Solo queda el período.
    /// </summary>
    /// <remarks>
    /// <para>
    /// El CHECK viejo hacía imposible el import de historial (US-014): el documento que sube el
    /// alumno no dice en qué comisión cursó, así que el confirm siempre manda null y cualquier
    /// materia aprobada por cursada (o sea, casi todas) rebotaba. Motivo completo en
    /// <c>EnrollmentRecordErrors.CursadaApprovalRequiresTerm</c>.
    /// </para>
    /// <para>
    /// El <c>Down</c> restituye el CHECK estricto y por eso solo corre limpio si todavía no entró
    /// ninguna cursada sin comisión. Con filas de esas, la restitución falla y hay que decidir qué
    /// hacer con ellas antes: revertir el schema no puede inventar la comisión que nunca existió.
    /// </para>
    /// </remarks>
    public partial class CursadaApprovalNoLongerRequiresCommission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_enrollment_records_cursada_requires_commission_and_term",
                schema: "enrollments",
                table: "enrollment_records");

            migrationBuilder.AddCheckConstraint(
                name: "ck_enrollment_records_cursada_requires_term",
                schema: "enrollments",
                table: "enrollment_records",
                sql: "approval_method NOT IN ('Coursework','Promotion','FinalExam') OR term_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_enrollment_records_cursada_requires_term",
                schema: "enrollments",
                table: "enrollment_records");

            migrationBuilder.AddCheckConstraint(
                name: "ck_enrollment_records_cursada_requires_commission_and_term",
                schema: "enrollments",
                table: "enrollment_records",
                sql: "approval_method NOT IN ('Coursework','Promotion','FinalExam') OR (commission_id IS NOT NULL AND term_id IS NOT NULL)");
        }
    }
}
