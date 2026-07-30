using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement of a review edited by its author (US-018).
///
/// <list type="bullet">
///   <item><b>Semantic Analytics</b>: would re-enqueue the embedding job once it exists; the
///         scaffolding was removed and there is no real consumer today (see the ADR-0007
///         revision).</item>
///   <item><b>Notifications</b> (future): a docente that already responded may want a
///         notification that the review was edited after their response.</item>
/// </list>
///
/// <para>
/// <c>StatusAfter</c> lets consumers decide whether to act: if the edit triggered the
/// content filter the review is now <c>UnderReview</c>, and once the embedding pipeline
/// exists its consumer can skip the recompute until moderation rules (ADR-0013).
/// </para>
/// </summary>
public sealed record ReviewEditedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid ReviewedTeacherId,
    string StatusBefore,
    string StatusAfter,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
