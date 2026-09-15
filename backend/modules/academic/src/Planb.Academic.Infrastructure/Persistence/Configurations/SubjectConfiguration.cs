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

        // Opcional: la fuente oficial del plan no siempre lo publica.
        builder.Property(s => s.Code)
            .HasColumnName("code")
            .HasMaxLength(40);

        // UNIQUE(career_plan_id, code): el código identifica la materia dentro del plan. Dos
        // planes distintos pueden tener "MAT101" sin conflicto. Sin filtro: Postgres ya trata cada
        // NULL como distinto de los demás, así que varias materias sin código conviven sin chocar.
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

        // Opcional: sin cadencia no hay cuatrimestre (CHECK más abajo).
        builder.Property(s => s.TermKind)
            .HasColumnName("term_kind")
            .HasConversion<string>()
            .HasMaxLength(20);

        // Opcionales: la fuente oficial del plan no siempre publica la carga horaria.
        builder.Property(s => s.WeeklyHours)
            .HasColumnName("weekly_hours");

        builder.Property(s => s.TotalHours)
            .HasColumnName("total_hours");

        builder.Property(s => s.Description)
            .HasColumnName("description");

        // Hereda del CareerPlan padre al materializarse. True por default para los seeded;
        // false cuando viene del flujo de import crowdsourced (US-088).
        builder.Property(s => s.IsOfficial)
            .HasColumnName("is_official")
            .HasDefaultValue(true)
            .IsRequired();

        // Soft delete (US-062). Default true: las materias existentes quedan activas al migrar.
        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // CHECK app-level del data-model: sin cadencia no hay cuatrimestre, anual tampoco lo lleva,
        // y cualquier otra cadencia lo exige. Lo replicamos en DB como defensa adicional (los
        // inserts via seed bypassean Subject.Create).
        builder.ToTable(t => t.HasCheckConstraint(
            "ck_subjects_term_kind_year_consistency",
            "(term_kind IS NULL AND term_in_year IS NULL) " +
            "OR (term_kind = 'FullYear' AND term_in_year IS NULL) " +
            "OR (term_kind IS NOT NULL AND term_kind <> 'FullYear' AND term_in_year IS NOT NULL)"));

        builder.Ignore(s => s.DomainEvents);
    }
}
