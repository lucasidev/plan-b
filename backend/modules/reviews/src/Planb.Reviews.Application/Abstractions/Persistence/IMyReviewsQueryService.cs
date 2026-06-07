using Planb.Reviews.Application.Features.GetMyReviews;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read-side for US-048 tab Mías. The student's own reviews, joined with the subject
/// catalog for the display strings.
///
/// Like <see cref="IPendingReviewsQueryService"/>, the implementation crosses schemas in a
/// single Dapper read (`reviews.reviews` JOIN `enrollments.enrollment_records` JOIN
/// `academic.subjects`). See ADR-0017 + ADR-0018 for the rationale that allows raw cross-
/// schema reads while still banning FK / EF nav cross-schema.
/// </summary>
public interface IMyReviewsQueryService
{
    Task<GetMyReviewsResponse> GetForStudentAsync(
        Guid studentProfileId, CancellationToken ct = default);
}
