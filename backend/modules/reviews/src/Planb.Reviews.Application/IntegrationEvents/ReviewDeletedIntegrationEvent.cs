using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement of a soft-deleted review (US-055).
///
/// <list type="bullet">
///   <item><b>Semantic Analytics</b>: drops the review's embedding so it stops surfacing
///         in semantic search and crowd insights (ADR-0007).</item>
///   <item><b>Rankings / feed caches</b>: invalidate so the review disappears from the
///         public reads on the next render.</item>
/// </list>
/// </summary>
public sealed record ReviewDeletedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    string StatusBefore,
    string Reason,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
