using Planb.Reviews.Application.Features.BrowseReviews;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read-side for US-048 tab Explorar (public feed). Returns Published reviews matching
/// the filter, paginated, newest first.
///
/// Why a separate service from <see cref="IMyReviewsQueryService"/>: the public feed
/// joins to <c>academic.subjects</c> for display + filters by <c>career_plan_id</c>
/// when present, which the "my reviews" listing does not need. Splitting keeps each
/// SQL focused.
/// </summary>
public interface IBrowseReviewsQueryService
{
    Task<BrowseReviewsResponse> BrowseAsync(BrowseReviewsQuery query, CancellationToken ct = default);
}
