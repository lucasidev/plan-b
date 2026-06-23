using FluentValidation;

namespace Planb.Reviews.Application.Features.CastReviewVote;

internal sealed class CastReviewVoteValidator : AbstractValidator<CastReviewVoteCommand>
{
    public CastReviewVoteValidator()
    {
        RuleFor(c => c.ReviewId).NotEmpty();
        RuleFor(c => c.VoterUserId).NotEmpty();
    }
}
