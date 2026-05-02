using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new UserId(value));

        builder.Property(u => u.Email)
            .HasColumnName("email")
            .HasConversion(
                email => email.Value,
                value => EmailAddress.Create(value).Value)
            .HasMaxLength(254)
            .IsRequired();

        // Partial unique index: solo bloqueamos duplicados de email cuando expired_at IS NULL.
        // Esto permite que un user expirado (US-022) coexista en la DB con un re-registro nuevo
        // del mismo email. El expired queda para audit, el activo es el operativo. Postgres
        // específico (HasFilter genera "WHERE ...").
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("ux_users_email_active")
            .HasFilter("expired_at IS NULL");

        builder.Property(u => u.PasswordHash)
            .HasColumnName("password_hash")
            .IsRequired();

        builder.Property(u => u.EmailVerifiedAt)
            .HasColumnName("email_verified_at");

        builder.Property(u => u.Role)
            .HasColumnName("role")
            .IsRequired();

        builder.Property(u => u.DisabledAt)
            .HasColumnName("disabled_at");

        builder.Property(u => u.DisabledReason)
            .HasColumnName("disabled_reason");

        builder.Property(u => u.DisabledBy)
            .HasColumnName("disabled_by");

        builder.Property(u => u.ExpiredAt)
            .HasColumnName("expired_at");

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Ignore(u => u.DomainEvents);

        builder.OwnsMany(u => u.Tokens, tokens =>
        {
            tokens.ToTable("verification_tokens");

            tokens.WithOwner().HasForeignKey("user_id");

            tokens.HasKey(t => t.Id);

            tokens.Property(t => t.Id)
                .HasColumnName("id")
                // The aggregate generates Ids itself (Guid.NewGuid in IssueVerificationToken)
                // so the value is NEVER produced by the database. Without this, EF Core's
                // detect-changes heuristic for owned collections sees a non-default Id and
                // assumes the entity already exists in the DB, marking new tokens as Modified
                // instead of Added. The UPDATE then affects 0 rows and SaveChanges blows up
                // with DbUpdateConcurrencyException.
                .ValueGeneratedNever();

            tokens.Property<UserId>("user_id")
                .HasColumnName("user_id")
                .HasConversion(id => id.Value, value => new UserId(value));

            tokens.HasIndex("user_id").HasDatabaseName("ix_verification_tokens_user_id");

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
                .HasDatabaseName("ux_verification_tokens_token");

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

        builder.Navigation(u => u.Tokens).AutoInclude();
    }
}
