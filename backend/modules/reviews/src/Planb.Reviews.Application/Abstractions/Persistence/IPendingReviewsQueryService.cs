using Planb.Reviews.Application.Features.GetMyPendingReviews;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read-side query for the "pending reviews" listing of US-048 (tab Pendientes).
///
/// A pending review is an enrollment in a terminal status (anything other than
/// <c>Cursando</c>) that does NOT have a Review row in the Reviews schema yet.
///
/// Implementation lives in Reviews.Infrastructure and runs a Dapper cross-schema query
/// (LEFT JOIN reviews.reviews ON enrollments.enrollment_records.id, filtering null). Cross-schema
/// Dapper reads are explicitly allowed by ADR-0017 + ADR-0018 (the ban is on FKs and EF
/// navigation properties, not raw read-only joins). The handler-level pattern of "use
/// IQueryService contract" stays the same; the cross-schema concern is contained inside the
/// Dapper SQL string in the Infrastructure implementation.
/// </summary>
public interface IPendingReviewsQueryService
{
    Task<IReadOnlyList<PendingReviewItem>> GetForStudentAsync(
        Guid studentProfileId, CancellationToken ct = default);
}
