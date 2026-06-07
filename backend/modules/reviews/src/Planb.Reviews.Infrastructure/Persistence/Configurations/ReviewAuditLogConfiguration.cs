using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Reviews.Domain.AuditLog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF mapping for <see cref="ReviewAuditLog"/>. Append-only table inside the
/// <c>reviews</c> schema. The <c>changes</c> column is persisted as <c>jsonb</c> so
/// future readers (moderation dashboards, integration tests) can index into the diff
/// without parsing the whole blob in C#.
/// </summary>
internal sealed class ReviewAuditLogConfiguration : IEntityTypeConfiguration<ReviewAuditLog>
{
    public void Configure(EntityTypeBuilder<ReviewAuditLog> builder)
    {
        builder.ToTable("review_audit_log");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ReviewAuditLogId(value));

        builder.Property(e => e.ReviewId)
            .HasColumnName("review_id")
            .HasConversion(id => id.Value, value => new ReviewId(value))
            .IsRequired();

        builder.Property(e => e.Action)
            .HasColumnName("action")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(e => e.ChangesJson)
            .HasColumnName("changes")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.PerformedByUserId)
            .HasColumnName("performed_by_user_id")
            .IsRequired();

        builder.Property(e => e.OccurredAt)
            .HasColumnName("occurred_at")
            .IsRequired();

        // Index on (review_id, occurred_at) supports the cooldown query (count edits in
        // the last 24h for a specific review). The cooldown also filters by action, but
        // the action column is low-cardinality so a multi-column index across review_id +
        // occurred_at is the better trade-off for now.
        builder.HasIndex(e => new { e.ReviewId, e.OccurredAt })
            .HasDatabaseName("ix_review_audit_log_review_id_occurred_at");
    }
}
