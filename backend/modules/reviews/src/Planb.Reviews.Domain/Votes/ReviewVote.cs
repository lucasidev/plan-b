using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Votes;

/// <summary>
/// Voto de utilidad de un lector sobre una reseña (helpfulness). Aggregate root propio: lo
/// escribe un user distinto del autor de la reseña, en su propia transacción, así que no es un
/// child del aggregate Review (a diferencia del audit log). Una sola fila por (review, votante),
/// garantizado por un UNIQUE en DB y por el flujo upsert del handler.
///
/// <para>
/// El identificador del votante existe en DB (necesario para enforzar 1-voto-por-user y para
/// resaltar "tu voto"), pero los conteos públicos (útil: N) nunca exponen quién votó.
/// </para>
/// </summary>
public sealed class ReviewVote : Entity<ReviewVoteId>, IAggregateRoot
{
    public ReviewId ReviewId { get; private set; }
    public Guid VoterUserId { get; private set; }

    /// <summary>true = "útil", false = "no útil" (los dos botones del mockup).</summary>
    public bool IsHelpful { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ReviewVote() { }

    public static ReviewVote Cast(
        ReviewId reviewId, Guid voterUserId, bool isHelpful, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (voterUserId == Guid.Empty)
        {
            throw new ArgumentException("VoterUserId cannot be empty.", nameof(voterUserId));
        }

        var now = clock.UtcNow;
        return new ReviewVote
        {
            Id = ReviewVoteId.New(),
            ReviewId = reviewId,
            VoterUserId = voterUserId,
            IsHelpful = isHelpful,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Cambia el sentido del voto (de útil a no-útil o viceversa). No-op si ya está en ese
    /// sentido. El handler usa esto cuando el votante toca el botón contrario al que ya votó.
    /// </summary>
    public void ChangeTo(bool isHelpful, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (IsHelpful == isHelpful)
        {
            return;
        }

        IsHelpful = isHelpful;
        UpdatedAt = clock.UtcNow;
    }
}
