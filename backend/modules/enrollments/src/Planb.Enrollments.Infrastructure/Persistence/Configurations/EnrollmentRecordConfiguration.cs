using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Enrollments.Domain.EnrollmentRecords;

namespace Planb.Enrollments.Infrastructure.Persistence.Configurations;

internal sealed class EnrollmentRecordConfiguration : IEntityTypeConfiguration<EnrollmentRecord>
{
    public void Configure(EntityTypeBuilder<EnrollmentRecord> builder)
    {
        builder.ToTable("enrollment_records");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new EnrollmentRecordId(value));

        // Cross-BC refs (ADR-0017): UUIDs sin FK Postgres.
        builder.Property(e => e.StudentProfileId)
            .HasColumnName("student_profile_id")
            .IsRequired();

        builder.Property(e => e.SubjectId)
            .HasColumnName("subject_id")
            .IsRequired();

        builder.Property(e => e.CommissionId)
            .HasColumnName("commission_id");

        builder.Property(e => e.TermId)
            .HasColumnName("term_id");

        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.ApprovalMethod)
            .HasColumnName("approval_method")
            .HasConversion<string?>()
            .HasMaxLength(20);

        // Grade es un VO `Grade?`. Mapearlo como decimal nullable.
        builder.Property(e => e.Grade)
            .HasColumnName("grade")
            .HasColumnType("numeric(4,2)")
            .HasConversion(
                vo => vo == null ? (decimal?)null : vo.Value.Value,
                raw => raw == null ? (Grade?)null : new Grade(raw.Value));

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // Lookup principal del read path: historial de un student.
        builder.HasIndex(e => e.StudentProfileId)
            .HasDatabaseName("ix_enrollment_records_student");

        // UNIQUE(student, subject, term): 1 cursada por triple. NULL en term (equivalencias)
        // queda fuera del UNIQUE por la semántica de NULL en Postgres. El segundo unique
        // partial para equivalencias va aparte.
        builder.HasIndex(e => new { e.StudentProfileId, e.SubjectId, e.TermId })
            .IsUnique()
            .HasDatabaseName("ux_enrollment_records_student_subject_term");

        // UNIQUE(student, subject) cuando approval_method=Equivalencia: una sola equivalencia
        // por (student, subject), independiente del term (que es null).
        builder.HasIndex(e => new { e.StudentProfileId, e.SubjectId })
            .IsUnique()
            .HasFilter("approval_method = 'Equivalencia'")
            .HasDatabaseName("ux_enrollment_records_student_subject_equivalencia");

        // CHECKs del data-model. Replicados en DB como defensa adicional para writes que
        // bypassean el aggregate (raw SQL, migración manual).
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "ck_enrollment_records_status_grade_consistency",
                "(status IN ('Aprobada','Regular') AND grade IS NOT NULL) OR " +
                "(status IN ('Cursando','Reprobada','Abandonada') AND grade IS NULL)");

            t.HasCheckConstraint(
                "ck_enrollment_records_status_approval_method_consistency",
                "(status = 'Aprobada' AND approval_method IS NOT NULL) OR " +
                "(status <> 'Aprobada' AND approval_method IS NULL)");

            t.HasCheckConstraint(
                "ck_enrollment_records_equivalencia_no_commission_no_term",
                "approval_method IS DISTINCT FROM 'Equivalencia' OR " +
                "(commission_id IS NULL AND term_id IS NULL)");

            t.HasCheckConstraint(
                "ck_enrollment_records_final_libre_term_only",
                "approval_method IS DISTINCT FROM 'FinalLibre' OR " +
                "(commission_id IS NULL AND term_id IS NOT NULL)");

            t.HasCheckConstraint(
                "ck_enrollment_records_cursada_requires_commission_and_term",
                "approval_method NOT IN ('Cursada','Promocion','Final') OR " +
                "(commission_id IS NOT NULL AND term_id IS NOT NULL)");

            t.HasCheckConstraint(
                "ck_enrollment_records_grade_range",
                "grade IS NULL OR (grade >= 0 AND grade <= 10)");
        });

        builder.Ignore(e => e.DomainEvents);
    }
}
