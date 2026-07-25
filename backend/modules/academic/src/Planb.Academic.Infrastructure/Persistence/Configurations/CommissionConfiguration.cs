using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class CommissionConfiguration : IEntityTypeConfiguration<Commission>
{
    public void Configure(EntityTypeBuilder<Commission> builder)
    {
        builder.ToTable("commissions");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new CommissionId(value));

        // SubjectId / TermId son refs cross-aggregate como Guid plano (sin FK Postgres, ADR-0017).
        builder.Property(c => c.SubjectId).HasColumnName("subject_id").IsRequired();
        builder.Property(c => c.TermId).HasColumnName("term_id").IsRequired();

        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(Commission.MaxNameLength)
            .IsRequired();

        builder.Property(c => c.Modality)
            .HasColumnName("modality")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(c => c.Capacity).HasColumnName("capacity");

        builder.Property(c => c.Notes)
            .HasColumnName("notes")
            .HasMaxLength(Commission.MaxNotesLength);

        builder.Property(c => c.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // UNIQUE(subject_id, term_id, name). El prefijo (subject_id, term_id) sirve además el
        // lookup secundario "comisiones de la materia en ese cuatri", así que no hace falta un
        // índice no-único separado.
        builder.HasIndex(c => new { c.SubjectId, c.TermId, c.Name })
            .IsUnique()
            .HasDatabaseName("ux_commissions_subject_term_name");

        builder.Ignore(c => c.DomainEvents);

        builder.OwnsMany(c => c.Teachers, ct =>
        {
            ct.ToTable("commission_teachers");

            ct.Property<CommissionId>("commission_id")
                .HasColumnName("commission_id")
                .HasConversion(id => id.Value, value => new CommissionId(value));

            ct.WithOwner().HasForeignKey("commission_id");

            ct.Property(t => t.TeacherId)
                .HasColumnName("teacher_id")
                .HasConversion(id => id.Value, value => new TeacherId(value));

            // PRIMARY KEY (commission_id, teacher_id): permite varios docentes por comisión con
            // roles distintos, sin duplicar el mismo docente.
            ct.HasKey("commission_id", "TeacherId");

            ct.Property(t => t.Role)
                .HasColumnName("role")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
        });

        builder.Navigation(c => c.Teachers).AutoInclude();

        builder.OwnsMany(c => c.Schedules, cs =>
        {
            cs.ToTable("commission_schedules");

            cs.Property<CommissionId>("commission_id")
                .HasColumnName("commission_id")
                .HasConversion(id => id.Value, value => new CommissionId(value));

            cs.WithOwner().HasForeignKey("commission_id");

            // DayOfWeek como string ("Monday".."Sunday"), igual criterio que los otros enums.
            cs.Property(s => s.Day)
                .HasColumnName("day_of_week")
                .HasConversion<string>()
                .HasMaxLength(16)
                .IsRequired();

            // TimeOnly -> time (sin timezone): hora del día, no un instante. Npgsql lo mapea directo.
            cs.Property(s => s.StartTime).HasColumnName("start_time").IsRequired();
            cs.Property(s => s.EndTime).HasColumnName("end_time").IsRequired();

            // PRIMARY KEY (commission_id, day_of_week, start_time): admite varias franjas el mismo
            // día si arrancan a horas distintas (teórico + práctico). El no-solape lo garantiza el
            // aggregate, no la PK.
            cs.HasKey("commission_id", "Day", "StartTime");
        });

        builder.Navigation(c => c.Schedules).AutoInclude();
    }
}
