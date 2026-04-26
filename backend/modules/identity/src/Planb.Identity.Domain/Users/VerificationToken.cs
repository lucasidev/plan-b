using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Child entity of <see cref="User"/>. Represents a verification token issued for a specific
/// <see cref="TokenPurpose"/>. Lifecycle: Issue (active) → Consume or Invalidate. Tokens never
/// transition back from Consumed/Invalidated. Per ADR-0033 the token has no aggregate identity
/// of its own; it is loaded and persisted with its parent User.
/// </summary>
public sealed class VerificationToken : Entity<Guid>
{
    public TokenPurpose Purpose { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTimeOffset IssuedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? ConsumedAt { get; private set; }
    public DateTimeOffset? InvalidatedAt { get; private set; }

    public bool IsConsumed => ConsumedAt is not null;
    public bool IsInvalidated => InvalidatedAt is not null;
    public bool IsActive => !IsConsumed && !IsInvalidated;
    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;

    private VerificationToken() { }

    internal VerificationToken(
        Guid id,
        TokenPurpose purpose,
        string token,
        DateTimeOffset issuedAt,
        DateTimeOffset expiresAt)
    {
        Id = id;
        Purpose = purpose;
        Token = token;
        IssuedAt = issuedAt;
        ExpiresAt = expiresAt;
    }

    internal void Consume(DateTimeOffset now) => ConsumedAt = now;

    internal void Invalidate(DateTimeOffset now) => InvalidatedAt = now;
}
