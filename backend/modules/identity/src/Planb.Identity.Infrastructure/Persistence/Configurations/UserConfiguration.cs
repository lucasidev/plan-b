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

        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("ux_users_email");

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

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Ignore(u => u.DomainEvents);
    }
}
