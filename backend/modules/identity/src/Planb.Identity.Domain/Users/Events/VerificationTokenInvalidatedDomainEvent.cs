using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

public sealed record VerificationTokenInvalidatedDomainEvent(
    UserId UserId,
    Guid TokenId,
    TokenPurpose Purpose,
    DateTimeOffset OccurredAt) : IDomainEvent;
