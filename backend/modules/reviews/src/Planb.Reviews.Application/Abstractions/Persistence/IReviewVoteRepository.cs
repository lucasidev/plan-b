using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Votes;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Write-side del aggregate <see cref="ReviewVote"/>. El handler de votar resuelve el voto
/// existente del par (review, votante) para decidir entre crear / cambiar / sacar (toggle).
/// </summary>
public interface IReviewVoteRepository
{
    Task<ReviewVote?> FindByReviewAndVoterAsync(
        ReviewId reviewId, Guid voterUserId, CancellationToken ct = default);

    void Add(ReviewVote vote);

    void Remove(ReviewVote vote);

    /// <summary>
    /// Conteo (helpful, notHelpful) de votos de una reseña. El handler lo llama post-SaveChanges
    /// para devolver el estado resultante y que el cliente actualice los botones sin refetch.
    /// </summary>
    Task<(int Helpful, int NotHelpful)> CountForReviewAsync(
        ReviewId reviewId, CancellationToken ct = default);
}
