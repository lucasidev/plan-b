using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement of a review edited by its author (US-018).
///
/// <list type="bullet">
///   <item><b>Semantic Analytics</b>: re-enqueues the embedding job (ADR-0007). The text
///         changed, so the previous vector is stale.</item>
///   <item><b>Notifications</b> (future): a docente that already responded may want a
///         notification that the review was edited after their response.</item>
/// </list>
///
/// <para>
/// <c>StatusAfter</c> lets consumers decide whether to act: if the edit triggered the
/// content filter the review is now <c>UnderReview</c> and the embedding consumer can
/// skip the recompute until moderation rules.
/// </para>
/// </summary>
public sealed record ReviewEditedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    string StatusBefore,
    string StatusAfter,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
