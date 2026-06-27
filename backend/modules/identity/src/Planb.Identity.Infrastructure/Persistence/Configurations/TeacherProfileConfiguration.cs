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

        builder.Property(p => p.InstitutionalEmail)
            .HasColumnName("institutional_email")
            .HasMaxLength(254);

        builder.Property(p => p.VerificationMethod)
            .HasColumnName("verification_method")
            .HasConversion<string>()
            .HasMaxLength(32);

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

        // Tokens de verificación institucional (US-031). Owned collection en su propia tabla, mismo
        // patrón que verification_tokens de User. El aggregate genera el Id (ValueGeneratedNever).
        builder.OwnsMany(p => p.Tokens, tokens =>
        {
            tokens.ToTable("teacher_verification_tokens");

            tokens.WithOwner().HasForeignKey("teacher_profile_id");

            tokens.HasKey(t => t.Id);

            tokens.Property(t => t.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            tokens.Property<TeacherProfileId>("teacher_profile_id")
                .HasColumnName("teacher_profile_id")
                .HasConversion(id => id.Value, value => new TeacherProfileId(value));

            tokens.HasIndex("teacher_profile_id")
                .HasDatabaseName("ix_teacher_verification_tokens_profile_id");

            tokens.Property(t => t.Purpose)
                .HasColumnName("purpose")
                .HasConversion<string>()
                .HasMaxLength(64)
                .IsRequired();

            tokens.Property(t => t.Token)
                .HasColumnName("token")
                .HasMaxLength(128)
                .IsRequired();

            tokens.HasIndex(t => t.Token)
                .IsUnique()
                .HasDatabaseName("ux_teacher_verification_tokens_token");

            tokens.Property(t => t.IssuedAt)
                .HasColumnName("issued_at")
                .IsRequired();

            tokens.Property(t => t.ExpiresAt)
                .HasColumnName("expires_at")
                .IsRequired();

            tokens.Property(t => t.ConsumedAt)
                .HasColumnName("consumed_at");

            tokens.Property(t => t.InvalidatedAt)
                .HasColumnName("invalidated_at");
        });

        builder.Navigation(p => p.Tokens).AutoInclude();
    }
}
