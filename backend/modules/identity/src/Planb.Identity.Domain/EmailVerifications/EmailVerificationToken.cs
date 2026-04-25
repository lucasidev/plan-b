using Planb.Identity.Domain.EmailVerifications.Events;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.EmailVerifications;

/// <summary>
/// Aggregate root for an email-verification token issued to a User. Lifecycle is:
/// <c>Issue</c> → (link clicked) → <c>Consume</c>, or expire after the configured TTL.
/// References to <see cref="UserId"/> are opaque (no FK across aggregates per ADR-0017),
/// so consistency is enforced by the application layer at issuance time.
/// </summary>
public sealed class EmailVerificationToken
    : Entity<EmailVerificationTokenId>, IAggregateRoot
{
    public UserId UserId { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTimeOffset IssuedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? ConsumedAt { get; private set; }

    public bool IsConsumed => ConsumedAt is not null;
    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;

    private EmailVerificationToken() { }

    public static Result<EmailVerificationToken> Issue(
        UserId userId,
        string token,
        TimeSpan ttl,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(token))
        {
            return EmailVerificationTokenErrors.TokenRequired;
        }

        if (ttl <= TimeSpan.Zero)
        {
            return EmailVerificationTokenErrors.TtlMustBePositive;
        }

        var now = clock.UtcNow;
        var expiresAt = now.Add(ttl);
        var instance = new EmailVerificationToken
        {
            Id = EmailVerificationTokenId.New(),
            UserId = userId,
            Token = token,
            IssuedAt = now,
            ExpiresAt = expiresAt,
        };
        instance.Raise(new EmailVerificationTokenIssuedDomainEvent(
            instance.Id, userId, token, expiresAt, now));
        return instance;
    }

    public Result Consume(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsConsumed)
        {
            return EmailVerificationTokenErrors.AlreadyConsumed;
        }

        var now = clock.UtcNow;
        if (IsExpired(now))
        {
            return EmailVerificationTokenErrors.Expired;
        }

        ConsumedAt = now;
        return Result.Success();
    }
}
