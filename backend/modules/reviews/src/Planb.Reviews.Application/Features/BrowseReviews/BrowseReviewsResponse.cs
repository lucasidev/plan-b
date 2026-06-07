namespace Planb.Reviews.Application.Features.BrowseReviews;

/// <summary>
/// Response payload of GET /api/reviews. Carries the page of items plus pagination
/// metadata so the client can render pagers without a second request.
///
/// <c>TotalCount</c> is the total number of items that match the filter (not just the
/// current page). It enables "X de Y" labels and proper page count derivation
/// (<c>ceil(total / pageSize)</c>).
/// </summary>
public sealed record BrowseReviewsResponse(
    IReadOnlyList<BrowseReviewItem> Items,
    int Page,
    int PageSize,
    int TotalCount);
