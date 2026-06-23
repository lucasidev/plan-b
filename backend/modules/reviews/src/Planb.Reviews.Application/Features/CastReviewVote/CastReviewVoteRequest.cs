namespace Planb.Reviews.Application.Features.CastReviewVote;

/// <summary>
/// Body de POST /api/reviews/{id}/vote. El <c>userId</c> sale del JWT, no del body.
/// </summary>
public sealed record CastReviewVoteRequest(bool Helpful);
