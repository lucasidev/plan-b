namespace Planb.Reviews.Application.Features.RespondToReview;

/// <summary>
/// US-040: el docente (<see cref="UserId"/>, del JWT) responde la reseña <see cref="ReviewId"/> con
/// <see cref="Text"/>.
/// </summary>
public sealed record RespondToReviewCommand(Guid ReviewId, Guid UserId, string Text);
