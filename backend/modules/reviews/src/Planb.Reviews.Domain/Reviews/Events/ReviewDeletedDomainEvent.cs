using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event raised when a review is soft-deleted (US-055). The translator to the
/// integration event invalidates feed/ranking caches and lets downstream consumers
/// (embedding store, future notifications) drop the review.
///
/// <c>StatusBefore</c> tells consumers whether the review was visible (Published) before
/// the delete: a consumer that only indexes Published reviews can skip work when the
/// review was already UnderReview.
/// </summary>
public sealed record ReviewDeletedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    ReviewStatus StatusBefore,
    ReviewDeletedReason Reason,
    DateTimeOffset OccurredAt) : IDomainEvent;
