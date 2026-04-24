using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

public sealed record UserEmailVerifiedDomainEvent(
    UserId UserId,
    DateTimeOffset OccurredAt) : IDomainEvent;
