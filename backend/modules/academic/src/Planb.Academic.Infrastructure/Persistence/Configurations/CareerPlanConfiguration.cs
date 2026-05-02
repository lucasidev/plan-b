using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.CareerPlans;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class CareerPlanConfiguration : IEntityTypeConfiguration<CareerPlan>
{
    public void Configure(EntityTypeBuilder<CareerPlan> builder)
    {
        builder.ToTable("career_plans");

        builder.HasKey(cp => cp.Id);

        builder.Property(cp => cp.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new CareerPlanId(value));

        builder.Property(cp => cp.CareerId)
            .HasColumnName("career_id")
            .HasConversion(id => id.Value, value => new CareerId(value))
            .IsRequired();

        builder.HasIndex(cp => cp.CareerId).HasDatabaseName("ix_career_plans_career_id");

        builder.Property(cp => cp.Year)
            .HasColumnName("year")
            .IsRequired();

        // Un (career, year) único: no puede haber 2 planes para la misma carrera con el mismo
        // año de salida. Si la universidad cambia el plan a mitad de año, va a 2025 (o un nuevo
        // year ID), no overwrite del Plan 2024.
        builder.HasIndex(cp => new { cp.CareerId, cp.Year })
            .IsUnique()
            .HasDatabaseName("ux_career_plans_career_year");

        builder.Property(cp => cp.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(cp => cp.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Ignore(cp => cp.DomainEvents);
    }
}
