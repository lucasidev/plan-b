using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

public sealed record UserSignedInDomainEvent(
    UserId UserId,
    DateTimeOffset OccurredAt) : IDomainEvent;
