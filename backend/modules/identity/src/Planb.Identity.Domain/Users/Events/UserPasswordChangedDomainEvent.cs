using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

/// <summary>
/// Raised when a user changes their password while authenticated (US-079-i). Distinct from
/// <see cref="PasswordResetCompletedDomainEvent"/> which fires after a forgot-password reset
/// via email token: this event signals a deliberate rotation from inside an active session,
/// so downstream consumers (notifications, audit log) can use different copy or surface
/// (e.g. "password changed from device" vs "password reset via email").
/// </summary>
public sealed record UserPasswordChangedDomainEvent(
    UserId UserId,
    DateTimeOffset OccurredAt) : IDomainEvent;
