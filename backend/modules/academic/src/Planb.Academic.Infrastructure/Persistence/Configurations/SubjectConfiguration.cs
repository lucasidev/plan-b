using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("subjects");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new SubjectId(value));

        builder.Property(s => s.CareerPlanId)
            .HasColumnName("career_plan_id")
            .HasConversion(id => id.Value, value => new CareerPlanId(value))
            .IsRequired();

        builder.HasIndex(s => s.CareerPlanId).HasDatabaseName("ix_subjects_career_plan_id");

        builder.Property(s => s.Code)
            .HasColumnName("code")
            .HasMaxLength(40)
            .IsRequired();

        // UNIQUE(career_plan_id, code): el código identifica la materia dentro del plan. Dos
        // planes distintos pueden tener "MAT101" sin conflicto.
        builder.HasIndex(s => new { s.CareerPlanId, s.Code })
            .IsUnique()
            .HasDatabaseName("ux_subjects_plan_code");

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.YearInPlan)
            .HasColumnName("year_in_plan")
            .IsRequired();

        builder.Property(s => s.TermInYear)
            .HasColumnName("term_in_year");

        builder.Property(s => s.TermKind)
            .HasColumnName("term_kind")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.WeeklyHours)
            .HasColumnName("weekly_hours")
            .IsRequired();

        builder.Property(s => s.TotalHours)
            .HasColumnName("total_hours")
            .IsRequired();

        builder.Property(s => s.Description)
            .HasColumnName("description");

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // CHECK app-level del data-model: term_kind='anual' ↔ term_in_year IS NULL. Lo replicamos
        // en DB como defensa adicional (los inserts via seed bypassean Subject.Create).
        builder.ToTable(t => t.HasCheckConstraint(
            "ck_subjects_term_kind_year_consistency",
            "(term_kind = 'Anual' AND term_in_year IS NULL) OR (term_kind <> 'Anual' AND term_in_year IS NOT NULL)"));

        builder.Ignore(s => s.DomainEvents);
    }
}
