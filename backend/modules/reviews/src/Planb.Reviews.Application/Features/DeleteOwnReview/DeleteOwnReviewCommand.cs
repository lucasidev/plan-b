namespace Planb.Reviews.Application.Features.DeleteOwnReview;

/// <summary>
/// Command for US-055 (author soft-deletes their own review). The endpoint extracts
/// <see cref="UserId"/> from the JWT and the <see cref="ReviewId"/> from the route.
/// </summary>
public sealed record DeleteOwnReviewCommand(
    Guid ReviewId,
    Guid UserId);
