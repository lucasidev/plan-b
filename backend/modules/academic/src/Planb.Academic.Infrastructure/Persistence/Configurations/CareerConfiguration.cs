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

        // Nombre corto (US-061, opcional). El crowdsourcing lo deja null; el form admin lo exige.
        builder.Property(c => c.ShortName)
            .HasColumnName("short_name")
            .HasMaxLength(100);

        // Código institucional (US-061, opcional). Único por university cuando se provee: índice
        // parcial (solo filas con code no-null) para no colisionar entre las muchas carreras sin code.
        builder.Property(c => c.Code)
            .HasColumnName("code")
            .HasMaxLength(40);

        builder.HasIndex(c => new { c.UniversityId, c.Code })
            .IsUnique()
            .HasFilter("code IS NOT NULL")
            .HasDatabaseName("ux_careers_university_code");

        // True = creada por backoffice (admin/staff). False = crowdsourced por alumno en
        // onboarding paso 2 (US-088). El frontend muestra badge "No oficial" cuando es false.
        builder.Property(c => c.IsOfficial)
            .HasColumnName("is_official")
            .HasDefaultValue(true)
            .IsRequired();

        // Soft delete (US-061). Default true: las carreras existentes quedan activas.
        builder.Property(c => c.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Ignore(c => c.DomainEvents);
    }
}
