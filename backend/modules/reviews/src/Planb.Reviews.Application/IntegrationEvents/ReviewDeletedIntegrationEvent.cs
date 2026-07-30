using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement of a soft-deleted review (US-055).
///
/// <list type="bullet">
///   <item><b>Semantic Analytics</b>: would drop the review's embedding so it stops
///         surfacing in semantic search and crowd insights, once that pipeline exists
///         (see the ADR-0007 revision: there is no embedding to drop today).</item>
///   <item><b>Rankings / feed caches</b>: invalidate so the review disappears from the
///         public reads on the next render.</item>
/// </list>
/// </summary>
public sealed record ReviewDeletedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid? ReviewedTeacherId,
    string StatusBefore,
    string Reason,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
