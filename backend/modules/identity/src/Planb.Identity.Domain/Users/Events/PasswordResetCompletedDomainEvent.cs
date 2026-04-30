using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

/// <summary>
/// Raised when a user successfully resets their password through the forgot-password flow.
/// Audit-only signal: nothing in the same bounded context reacts to it today, but downstream
/// consumers (ReviewModeration metrics, security audit log) can subscribe via the outbox.
/// </summary>
public sealed record PasswordResetCompletedDomainEvent(
    UserId UserId,
    DateTimeOffset OccurredAt) : IDomainEvent;
