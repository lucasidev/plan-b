using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

/// <summary>
/// Emitted when a user self-deletes their account (UC-038, right of erasure / Ley 25.326 art. 6).
/// Carries the email so that a local translator inside the Identity module can hash it for the
/// audit log (the aggregate is about to be removed from the DB, so the email is no longer
/// queryable after this point). Cross-BC consumers should subscribe to the integration event
/// counterpart (<see cref="Planb.Identity.Application.IntegrationEvents.UserAccountDeletedIntegrationEvent"/>),
/// which carries only the <see cref="UserId"/> — the email never leaves Identity.
/// </summary>
public sealed record UserAccountDeletedDomainEvent(
    UserId UserId,
    EmailAddress Email,
    DateTimeOffset OccurredAt) : IDomainEvent;
