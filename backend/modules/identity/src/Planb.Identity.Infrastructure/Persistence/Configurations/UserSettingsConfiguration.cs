using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Persistence.Configurations;

internal sealed class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.ToTable("user_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new UserSettingsId(value));

        builder.Property(s => s.UserId)
            .HasColumnName("user_id")
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        // Unique por user: cada user tiene a lo sumo un settings row. La constraint en DB es
        // la garantía dura; el handler también chequea antes de Add pero podría perder un race.
        builder.HasIndex(s => s.UserId)
            .IsUnique()
            .HasDatabaseName("ux_user_settings_user_id");

        builder.Property(s => s.NotificationsInApp)
            .HasColumnName("notifications_in_app")
            .IsRequired();

        builder.Property(s => s.NotificationsEmail)
            .HasColumnName("notifications_email")
            .IsRequired();

        builder.Property(s => s.NotifyReviewResponse)
            .HasColumnName("notify_review_response")
            .IsRequired();

        builder.Property(s => s.NotifyNewReviewInFollowed)
            .HasColumnName("notify_new_review_in_followed")
            .IsRequired();

        builder.Property(s => s.NotifyAcademicCalendar)
            .HasColumnName("notify_academic_calendar")
            .IsRequired();

        builder.Property(s => s.NotifyDraftPromotionNudge)
            .HasColumnName("notify_draft_promotion_nudge")
            .IsRequired();

        builder.Property(s => s.ShowDisplayNameInReviews)
            .HasColumnName("show_display_name_in_reviews")
            .IsRequired();

        builder.Property(s => s.AllowTeacherContact)
            .HasColumnName("allow_teacher_contact")
            .IsRequired();

        // Enums como string para legibilidad en consultas ad-hoc. Comportamiento estable bajo
        // adición de valores nuevos (el orden numérico cambia, el string no).
        builder.Property(s => s.Language)
            .HasColumnName("language")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(s => s.Theme)
            .HasColumnName("theme")
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();
    }
}
