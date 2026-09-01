namespace Planb.Reviews.Application.Features.DeleteReview;

/// <summary>Borrar una reseña propia. La cuenta sale del token: nadie borra la de otro.</summary>
public sealed record DeleteReviewCommand(Guid UserId, Guid ReviewId);
