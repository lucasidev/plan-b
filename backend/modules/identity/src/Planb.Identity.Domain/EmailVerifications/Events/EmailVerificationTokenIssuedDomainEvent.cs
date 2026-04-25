using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.EmailVerifications.Events;

public sealed record EmailVerificationTokenIssuedDomainEvent(
    EmailVerificationTokenId TokenId,
    UserId UserId,
    string Token,
    DateTimeOffset ExpiresAt,
    DateTimeOffset OccurredAt) : IDomainEvent;
