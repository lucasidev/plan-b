namespace Planb.Reviews.Application.Features.GetMyPendingReviews;

/// <summary>
/// Response payload of GET /api/reviews/me/pending. A wrapper around the list so future fields
/// (counters, last-refreshed timestamp, etc.) can be added without breaking the JSON shape.
/// </summary>
public sealed record GetMyPendingReviewsResponse(IReadOnlyList<PendingReviewItem> Items);
