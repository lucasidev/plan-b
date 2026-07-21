using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Enrollments.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialEnrollmentsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "enrollments");

            migrationBuilder.CreateTable(
                name: "enrollment_records",
                schema: "enrollments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    commission_id = table.Column<Guid>(type: "uuid", nullable: true),
                    term_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    approval_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    grade = table.Column<decimal>(type: "numeric(4,2)", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_enrollment_records", x => x.id);
                    table.CheckConstraint("ck_enrollment_records_cursada_requires_commission_and_term", "approval_method NOT IN ('Coursework','Promotion','FinalExam') OR (commission_id IS NOT NULL AND term_id IS NOT NULL)");
                    table.CheckConstraint("ck_enrollment_records_equivalencia_no_commission_no_term", "approval_method IS DISTINCT FROM 'CreditTransfer' OR (commission_id IS NULL AND term_id IS NULL)");
                    table.CheckConstraint("ck_enrollment_records_final_libre_term_only", "approval_method IS DISTINCT FROM 'IndependentFinalExam' OR (commission_id IS NULL AND term_id IS NOT NULL)");
                    table.CheckConstraint("ck_enrollment_records_grade_range", "grade IS NULL OR (grade >= 0 AND grade <= 10)");
                    table.CheckConstraint("ck_enrollment_records_status_approval_method_consistency", "(status = 'Passed' AND approval_method IS NOT NULL) OR (status <> 'Passed' AND approval_method IS NULL)");
                    table.CheckConstraint("ck_enrollment_records_status_grade_consistency", "(status IN ('Passed','Regularized') AND grade IS NOT NULL) OR (status IN ('InProgress','Failed','Dropped') AND grade IS NULL)");
                });

            migrationBuilder.CreateIndex(
                name: "ix_enrollment_records_student",
                schema: "enrollments",
                table: "enrollment_records",
                column: "student_profile_id");

            migrationBuilder.CreateIndex(
                name: "ux_enrollment_records_student_subject_equivalencia",
                schema: "enrollments",
                table: "enrollment_records",
                columns: new[] { "student_profile_id", "subject_id" },
                unique: true,
                filter: "approval_method = 'CreditTransfer'");

            migrationBuilder.CreateIndex(
                name: "ux_enrollment_records_student_subject_term",
                schema: "enrollments",
                table: "enrollment_records",
                columns: new[] { "student_profile_id", "subject_id", "term_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "enrollment_records",
                schema: "enrollments");
        }
    }
}
