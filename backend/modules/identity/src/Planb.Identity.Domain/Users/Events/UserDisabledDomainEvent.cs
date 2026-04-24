using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

public sealed record UserDisabledDomainEvent(
    UserId UserId,
    Guid DisabledBy,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent;
