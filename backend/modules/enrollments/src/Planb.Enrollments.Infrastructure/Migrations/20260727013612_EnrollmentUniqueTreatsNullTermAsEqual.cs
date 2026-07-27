using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Enrollments.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnrollmentUniqueTreatsNullTermAsEqual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_enrollment_records_student_subject_term",
                schema: "enrollments",
                table: "enrollment_records");

            migrationBuilder.CreateIndex(
                name: "ux_enrollment_records_student_subject_term",
                schema: "enrollments",
                table: "enrollment_records",
                columns: new[] { "student_profile_id", "subject_id", "term_id" },
                unique: true)
                .Annotation("Npgsql:NullsDistinct", false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_enrollment_records_student_subject_term",
                schema: "enrollments",
                table: "enrollment_records");

            migrationBuilder.CreateIndex(
                name: "ux_enrollment_records_student_subject_term",
                schema: "enrollments",
                table: "enrollment_records",
                columns: new[] { "student_profile_id", "subject_id", "term_id" },
                unique: true);
        }
    }
}
