using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Contracts;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Votes;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.CastReviewVote;

/// <summary>
/// Handler de votar una reseña (helpfulness). Flow:
/// <list type="number">
///   <item>Carga la reseña; debe existir y estar <c>Published</c> (no se vota UnderReview /
///         Removed / Deleted).</item>
///   <item>Rechaza el auto-voto: el votante no puede ser el autor (resuelto cross-BC vía
///         <see cref="IReviewQueryService.GetAuthorUserIdAsync"/>).</item>
///   <item>Toggle: si ya hay voto del par (review, votante) con el mismo sentido lo saca; si es
///         el sentido contrario lo cambia; si no hay, lo crea.</item>
///   <item>SaveChanges y devuelve los conteos resultantes + el voto del usuario.</item>
/// </list>
/// Todo corre en el scope [Transactional] de Wolverine.
/// </summary>
public static class CastReviewVoteCommandHandler
{
    public static async Task<Result<CastReviewVoteResponse>> Handle(
        CastReviewVoteCommand command,
        IReviewRepository reviews,
        IReviewVoteRepository votes,
        IReviewQueryService reviewQuery,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var reviewId = new ReviewId(command.ReviewId);

        var review = await reviews.FindByIdAsync(reviewId, ct);
        if (review is null)
        {
            return Result.Failure<CastReviewVoteResponse>(ReviewErrors.NotFound);
        }

        if (review.Status != ReviewStatus.Published)
        {
            return Result.Failure<CastReviewVoteResponse>(ReviewErrors.ReviewNotVotable);
        }

        var authorUserId = await reviewQuery.GetAuthorUserIdAsync(command.ReviewId, ct);
        if (authorUserId == command.VoterUserId)
        {
            return Result.Failure<CastReviewVoteResponse>(ReviewErrors.CannotVoteOwnReview);
        }

        var existing = await votes.FindByReviewAndVoterAsync(reviewId, command.VoterUserId, ct);
        bool? myVote;
        if (existing is null)
        {
            votes.Add(ReviewVote.Cast(reviewId, command.VoterUserId, command.IsHelpful, clock));
            myVote = command.IsHelpful;
        }
        else if (existing.IsHelpful == command.IsHelpful)
        {
            votes.Remove(existing); // toggle off: tocar el mismo botón saca el voto
            myVote = null;
        }
        else
        {
            existing.ChangeTo(command.IsHelpful, clock);
            myVote = command.IsHelpful;
        }

        await unitOfWork.SaveChangesAsync(ct);

        var (helpful, notHelpful) = await votes.CountForReviewAsync(reviewId, ct);
        return new CastReviewVoteResponse(helpful, notHelpful, myVote);
    }
}
