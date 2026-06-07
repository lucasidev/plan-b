namespace Planb.Reviews.Application.Features.GetMyReviews;

/// <summary>
/// Response payload of GET /api/reviews/me. The shape carries the items + a small stats
/// block the frontend renders as a header above the list ("3 publicadas · 0 en revisión").
///
/// Removed reviews count separately so the alumno still sees them in the list (greyed-out)
/// but the "publicadas" KPI stays honest.
/// </summary>
public sealed record GetMyReviewsResponse(
    IReadOnlyList<MyReviewItem> Items,
    MyReviewsStats Stats);

public sealed record MyReviewsStats(
    int TotalCount,
    int PublishedCount,
    int UnderReviewCount,
    int RemovedCount);
