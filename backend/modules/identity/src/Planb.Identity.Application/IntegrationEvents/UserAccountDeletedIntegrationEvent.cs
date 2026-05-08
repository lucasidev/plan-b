using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Identity.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement that a user has self-deleted (UC-038). Carries only the
/// <see cref="UserId"/> (no email, no PII), because every consumer (Reviews, Enrollments,
/// Moderation) only needs the id to look up its own user-owned data and remove it.
/// <para>
/// Published to Wolverine's outbox by a local handler that reacts to
/// <see cref="Planb.Identity.Domain.Users.Events.UserAccountDeletedDomainEvent"/>. Following
/// ADR-0030, cross-BC consistency is eventual: the user row in Identity is gone immediately,
/// but downstream cleanup (e.g. removing reviews owned by the user when Reviews aggregates
/// land) happens when the outbox delivers this event to that BC's handler. Wolverine retries
/// until delivery succeeds.
/// </para>
/// </summary>
public sealed record UserAccountDeletedIntegrationEvent(
    Guid EventId,
    Guid UserId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
