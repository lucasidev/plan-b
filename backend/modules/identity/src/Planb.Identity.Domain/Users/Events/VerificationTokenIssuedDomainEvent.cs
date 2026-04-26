using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

public sealed record VerificationTokenIssuedDomainEvent(
    UserId UserId,
    Guid TokenId,
    TokenPurpose Purpose,
    string Token,
    DateTimeOffset ExpiresAt,
    DateTimeOffset OccurredAt) : IDomainEvent;
