using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Configurations;

internal sealed class UserDeletionLogConfiguration : IEntityTypeConfiguration<UserDeletionLog>
{
    public void Configure(EntityTypeBuilder<UserDeletionLog> builder)
    {
        builder.ToTable("user_deletion_log");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new UserDeletionLogId(value))
            // Aggregate generates the Id (Guid.NewGuid in UserDeletionLogId.New). EF must not
            // assume DB-generated, otherwise it marks the row as Modified instead of Added.
            // Same reasoning as VerificationToken / StudentProfile in UserConfiguration.
            .ValueGeneratedNever();

        builder.Property(l => l.UserId)
            .HasColumnName("user_id")
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        // No FK to identity.users.id: by the time this row is written, the user is being
        // removed in the same transaction. The relationship is logical, not enforced. Index
        // exists for forensic lookups ("did this user id ever exist?").
        builder.HasIndex(l => l.UserId)
            .HasDatabaseName("ix_user_deletion_log_user_id");

        builder.Property(l => l.EmailHash)
            .HasColumnName("email_hash")
            .HasMaxLength(64) // SHA-256 hex = 64 chars
            .IsRequired();

        // Index on email_hash so the forensic query "has this email ever been deleted?" is fast
        // without scanning the table. Not unique: in theory two users could have the same email
        // hash (different casings of the same address normalize to one), but they'd be the same
        // user, which is impossible for active rows because of the partial unique on users.email
        // — so collisions only happen via brute-force collision attacks, ignored.
        builder.HasIndex(l => l.EmailHash)
            .HasDatabaseName("ix_user_deletion_log_email_hash");

        builder.Property(l => l.DeletedAt)
            .HasColumnName("deleted_at")
            .IsRequired();

        builder.Ignore(l => l.DomainEvents);
    }
}
