using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Moderation.Domain.Reports;

namespace Planb.Moderation.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF mapping for <see cref="ReviewReport"/> in the <c>moderation</c> schema. Cross-BC refs
/// (<c>review_id</c>, <c>reporter_user_id</c>) are plain UUID columns with no FK (ADR-0017).
/// </summary>
internal sealed class ReviewReportConfiguration : IEntityTypeConfiguration<ReviewReport>
{
    public void Configure(EntityTypeBuilder<ReviewReport> builder)
    {
        builder.ToTable("review_reports");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ReviewReportId(value));

        builder.Property(r => r.ReviewId)
            .HasColumnName("review_id")
            .IsRequired();

        builder.Property(r => r.ReporterUserId)
            .HasColumnName("reporter_user_id")
            .IsRequired();

        builder.Property(r => r.Reason)
            .HasColumnName("reason")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(r => r.Details)
            .HasColumnName("details")
            .HasColumnType("text");

        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // Resolución del moderador (US-051). Todo nullable: se estampan al pasar a Upheld/Dismissed.
        builder.Property(r => r.ModeratorUserId)
            .HasColumnName("moderator_user_id");

        builder.Property(r => r.ResolutionNote)
            .HasColumnName("resolution_note")
            .HasColumnType("text");

        builder.Property(r => r.ResolvedAt)
            .HasColumnName("resolved_at");

        // One report per reviewer per review. The handler pre-checks via ExistsAsync to
        // return a clean 409; this UNIQUE index is the race-safe backstop.
        builder.HasIndex(r => new { r.ReviewId, r.ReporterUserId })
            .IsUnique()
            .HasDatabaseName("ux_review_reports_review_reporter");

        // Read path: count open reports for a review (threshold check) + future moderation
        // queue listing.
        builder.HasIndex(r => new { r.ReviewId, r.Status })
            .HasDatabaseName("ix_review_reports_review_status");
    }
}
