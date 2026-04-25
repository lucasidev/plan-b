using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Identity.Domain.EmailVerifications;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Configurations;

internal sealed class EmailVerificationTokenConfiguration
    : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
    {
        builder.ToTable("email_verification_tokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new EmailVerificationTokenId(value));

        builder.Property(t => t.UserId)
            .HasColumnName("user_id")
            .HasConversion(id => id.Value, value => new UserId(value));

        builder.HasIndex(t => t.UserId).HasDatabaseName("ix_email_verification_tokens_user_id");

        builder.Property(t => t.Token)
            .HasColumnName("token")
            .HasMaxLength(128)
            .IsRequired();

        builder.HasIndex(t => t.Token)
            .IsUnique()
            .HasDatabaseName("ux_email_verification_tokens_token");

        builder.Property(t => t.IssuedAt)
            .HasColumnName("issued_at")
            .IsRequired();

        builder.Property(t => t.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(t => t.ConsumedAt)
            .HasColumnName("consumed_at");

        builder.Ignore(t => t.DomainEvents);
    }
}
