using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Votes;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class ReviewVoteRepository : IReviewVoteRepository
{
    private readonly ReviewsDbContext _db;

    public ReviewVoteRepository(ReviewsDbContext db) => _db = db;

    public Task<ReviewVote?> FindByReviewAndVoterAsync(
        ReviewId reviewId, Guid voterUserId, CancellationToken ct = default) =>
        _db.ReviewVotes
            .FirstOrDefaultAsync(v => v.ReviewId == reviewId && v.VoterUserId == voterUserId, ct);

    public void Add(ReviewVote vote) => _db.ReviewVotes.Add(vote);

    public void Remove(ReviewVote vote) => _db.ReviewVotes.Remove(vote);

    public async Task<(int Helpful, int NotHelpful)> CountForReviewAsync(
        ReviewId reviewId, CancellationToken ct = default)
    {
        var helpful = await _db.ReviewVotes
            .CountAsync(v => v.ReviewId == reviewId && v.IsHelpful, ct);
        var notHelpful = await _db.ReviewVotes
            .CountAsync(v => v.ReviewId == reviewId && !v.IsHelpful, ct);
        return (helpful, notHelpful);
    }
}
