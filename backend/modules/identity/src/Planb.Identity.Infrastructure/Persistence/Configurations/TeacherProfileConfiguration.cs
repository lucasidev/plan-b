using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Configurations;

internal sealed class TeacherProfileConfiguration : IEntityTypeConfiguration<TeacherProfile>
{
    public void Configure(EntityTypeBuilder<TeacherProfile> builder)
    {
        builder.ToTable("teacher_profiles");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("id")
            // El aggregate genera el Id (TeacherProfileId.New), nunca la DB: igual que en User /
            // StudentProfile, marcamos ValueGeneratedNever para que EF lo trate como Added y no como
            // Modified al persistir.
            .HasConversion(id => id.Value, value => new TeacherProfileId(value))
            .ValueGeneratedNever();

        builder.Property(p => p.UserId)
            .HasColumnName("user_id")
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        builder.Property(p => p.TeacherId)
            .HasColumnName("teacher_id")
            .IsRequired();

        builder.Property(p => p.VerifiedAt)
            .HasColumnName("verified_at");

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(p => p.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Ignore(p => p.DomainEvents);

        // Un user no puede reclamar dos veces el mismo docente (UNIQUE user+teacher).
        builder.HasIndex(p => new { p.UserId, p.TeacherId })
            .IsUnique()
            .HasDatabaseName("ux_teacher_profiles_user_teacher");

        // Partial unique: un docente tiene a lo sumo un TeacherProfile verificado (verification-flows).
        // Dos members pueden tener claims pending sobre el mismo docente; solo uno termina verified.
        builder.HasIndex(p => p.TeacherId)
            .IsUnique()
            .HasDatabaseName("ux_teacher_profiles_teacher_verified")
            .HasFilter("verified_at IS NOT NULL");
    }
}
