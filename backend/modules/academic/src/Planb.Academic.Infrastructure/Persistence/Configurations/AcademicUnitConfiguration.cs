using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class AcademicUnitConfiguration : IEntityTypeConfiguration<AcademicUnit>
{
    public void Configure(EntityTypeBuilder<AcademicUnit> builder)
    {
        builder.ToTable("academic_units");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new AcademicUnitId(value));

        builder.Property(u => u.UniversityId)
            .HasColumnName("university_id")
            .HasConversion(id => id.Value, value => new UniversityId(value))
            .IsRequired();

        builder.HasIndex(u => u.UniversityId).HasDatabaseName("ix_academic_units_university_id");

        builder.Property(u => u.Name)
            .HasColumnName("name")
            .HasMaxLength(AcademicUnit.MaxNameLength)
            .IsRequired();

        builder.Property(u => u.Slug)
            .HasColumnName("slug")
            .HasMaxLength(AcademicUnit.MaxSlugLength)
            .IsRequired();

        // Slug único por universidad (dos universidades pueden tener cada una su "facultad-de-ingenieria").
        // Sin FK a universities (ADR-0017, cross-aggregate), mismo criterio que Career.
        builder.HasIndex(u => new { u.UniversityId, u.Slug })
            .IsUnique()
            .HasDatabaseName("ux_academic_units_university_slug");

        builder.Property(u => u.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Ignore(u => u.DomainEvents);
    }
}
