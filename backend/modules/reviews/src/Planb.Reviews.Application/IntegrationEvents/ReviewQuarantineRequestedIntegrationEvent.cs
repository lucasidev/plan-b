using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC request to hide a review pending moderation (US-019). Owned by Reviews even
/// though Moderation is the publisher: the event is a contract of "what can be requested
/// of a review", which belongs to the review's bounded context. Keeping it here (and
/// having Moderation reference Reviews, never the reverse) keeps the assembly graph
/// acyclic while still letting Moderation drive the auto-hide.
///
/// Emitted by Moderation when the open report count for the review reaches the configured
/// auto-hide threshold (ADR-0010). Consumed by <c>ReviewQuarantineRequestedHandler</c>,
/// which transitions a Published review to UnderReview and writes the audit-log entry.
///
/// <c>TriggeredByUserId</c> is the reporter whose report tipped the count over the
/// threshold; it is recorded as the actor in the Reviews audit log so the lifecycle trail
/// shows why the review was hidden.
/// </summary>
public sealed record ReviewQuarantineRequestedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid TriggeredByUserId,
    int OpenReportCount,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
