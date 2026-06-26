using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
{
    public void Configure(EntityTypeBuilder<Teacher> builder)
    {
        builder.ToTable("teachers");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new TeacherId(value));

        builder.Property(t => t.UniversityId)
            .HasColumnName("university_id")
            .HasConversion(id => id.Value, value => new UniversityId(value))
            .IsRequired();

        builder.HasIndex(t => t.UniversityId).HasDatabaseName("ix_teachers_university_id");

        builder.Property(t => t.FirstName)
            .HasColumnName("first_name")
            .HasMaxLength(Teacher.MaxNameLength)
            .IsRequired();

        builder.Property(t => t.LastName)
            .HasColumnName("last_name")
            .HasMaxLength(Teacher.MaxNameLength)
            .IsRequired();

        builder.Property(t => t.Title)
            .HasColumnName("title")
            .HasMaxLength(Teacher.MaxTitleLength);

        builder.Property(t => t.Bio)
            .HasColumnName("bio")
            .HasMaxLength(Teacher.MaxBioLength);

        builder.Property(t => t.PhotoUrl)
            .HasColumnName("photo_url")
            .HasMaxLength(Teacher.MaxPhotoUrlLength);

        builder.Property(t => t.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(t => t.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Ignore(t => t.DomainEvents);
    }
}
