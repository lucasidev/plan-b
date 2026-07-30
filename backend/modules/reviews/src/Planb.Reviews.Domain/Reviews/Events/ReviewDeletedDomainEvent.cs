using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event raised when a review is soft-deleted (US-055). The translator to the
/// integration event invalidates feed/ranking caches; dropping it from an embedding store
/// is paused design without a real consumer yet (see the ADR-0007 revision), and
/// notifications are future work.
///
/// <c>StatusBefore</c> tells consumers whether the review was visible (Published) before
/// the delete: a consumer that only indexes Published reviews can skip work when the
/// review was already UnderReview.
/// </summary>
public sealed record ReviewDeletedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid ReviewedTeacherId,
    ReviewStatus StatusBefore,
    ReviewDeletedReason Reason,
    DateTimeOffset OccurredAt) : IDomainEvent;
