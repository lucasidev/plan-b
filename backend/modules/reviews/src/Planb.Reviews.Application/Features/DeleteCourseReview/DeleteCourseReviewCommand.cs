namespace Planb.Reviews.Application.Features.DeleteCourseReview;

/// <summary>Borrar una reseña propia. La cuenta sale del token: nadie borra la de otro.</summary>
public sealed record DeleteCourseReviewCommand(Guid UserId, Guid ReviewId);
