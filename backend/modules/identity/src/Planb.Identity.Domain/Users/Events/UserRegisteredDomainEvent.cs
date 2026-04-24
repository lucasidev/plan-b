using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

public sealed record UserRegisteredDomainEvent(
    UserId UserId,
    EmailAddress Email,
    DateTimeOffset OccurredAt) : IDomainEvent;
