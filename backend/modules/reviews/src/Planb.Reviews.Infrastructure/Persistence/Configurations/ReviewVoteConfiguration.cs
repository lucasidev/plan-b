using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Votes;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF mapping de <see cref="ReviewVote"/>. Tabla <c>review_votes</c> en el schema <c>reviews</c>.
/// UNIQUE (review_id, voter_user_id) enforza un solo voto por par a nivel DB (belt + suspenders
/// con el flujo upsert del handler).
/// </summary>
internal sealed class ReviewVoteConfiguration : IEntityTypeConfiguration<ReviewVote>
{
    public void Configure(EntityTypeBuilder<ReviewVote> builder)
    {
        builder.ToTable("review_votes");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ReviewVoteId(value));

        builder.Property(e => e.ReviewId)
            .HasColumnName("review_id")
            .HasConversion(id => id.Value, value => new ReviewId(value))
            .IsRequired();

        builder.Property(e => e.VoterUserId)
            .HasColumnName("voter_user_id")
            .IsRequired();

        builder.Property(e => e.IsHelpful)
            .HasColumnName("is_helpful")
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(e => new { e.ReviewId, e.VoterUserId })
            .IsUnique()
            .HasDatabaseName("ux_review_votes_review_voter");

        // Read path: contar votos de una reseña.
        builder.HasIndex(e => e.ReviewId)
            .HasDatabaseName("ix_review_votes_review_id");

        builder.Ignore(e => e.DomainEvents);
    }
}
