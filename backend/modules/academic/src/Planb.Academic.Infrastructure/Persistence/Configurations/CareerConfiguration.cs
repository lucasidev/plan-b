using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class CareerConfiguration : IEntityTypeConfiguration<Career>
{
    public void Configure(EntityTypeBuilder<Career> builder)
    {
        builder.ToTable("careers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new CareerId(value));

        builder.Property(c => c.UniversityId)
            .HasColumnName("university_id")
            .HasConversion(id => id.Value, value => new UniversityId(value))
            .IsRequired();

        builder.HasIndex(c => c.UniversityId).HasDatabaseName("ix_careers_university_id");

        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(c => c.Slug)
            .HasColumnName("slug")
            .HasMaxLength(120)
            .IsRequired();

        // Slug único per university (puede haber dos universidades con la misma "tudcs"). No-FK
        // a universities porque ADR-0017, asi que no podemos forzar el constraint en DB del lado
        // referenciado pero sí podemos garantizar no duplicates en el catálogo Academic.
        builder.HasIndex(c => new { c.UniversityId, c.Slug })
            .IsUnique()
            .HasDatabaseName("ux_careers_university_slug");

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Ignore(c => c.DomainEvents);
    }
}
