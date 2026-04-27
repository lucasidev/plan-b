using Planb.Identity.Domain.Users.Events;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Aggregate root for an authenticated account. See ADR-0008 for role semantics.
/// The aggregate treats <see cref="PasswordHash"/> as an opaque string — the hashing algorithm
/// lives in the infrastructure layer (see the PasswordHasher port). Per ADR-0033 verification
/// tokens are child entities of this aggregate, not a separate aggregate.
/// </summary>
public sealed class User : Entity<UserId>, IAggregateRoot
{
    public EmailAddress Email { get; private set; }
    public string PasswordHash { get; private set; } = null!;
    public DateTimeOffset? EmailVerifiedAt { get; private set; }
    public UserRole Role { get; private set; }
    public DateTimeOffset? DisabledAt { get; private set; }
    public string? DisabledReason { get; private set; }
    public Guid? DisabledBy { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<VerificationToken> _tokens = new();
    public IReadOnlyCollection<VerificationToken> Tokens => _tokens.AsReadOnly();

    public bool IsEmailVerified => EmailVerifiedAt is not null;
    public bool IsDisabled => DisabledAt is not null;
    public bool IsActive => !IsDisabled && IsEmailVerified;

    private User() { }

    /// <summary>
    /// Public self-registration (UC-010). Always creates a <see cref="UserRole.Member"/>
    /// with a pending-verification status (<see cref="EmailVerifiedAt"/> = null).
    /// Staff accounts (moderator / admin / university_staff) are created through a distinct
    /// factory because of ADR-0008 (staff cannot self-register).
    /// </summary>
    public static Result<User> Register(
        EmailAddress email,
        string passwordHash,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            return UserErrors.PasswordHashRequired;
        }

        var now = clock.UtcNow;
        var user = new User
        {
            Id = UserId.New(),
            Email = email,
            PasswordHash = passwordHash,
            Role = UserRole.Member,
            CreatedAt = now,
            UpdatedAt = now,
        };
        user.Raise(new UserRegisteredDomainEvent(user.Id, email, now));
        return user;
    }

    /// <summary>
    /// Issues a new <see cref="VerificationToken"/> for the given purpose. Any existing active
    /// token of the same purpose is invalidated (one active token per purpose, per ADR-0033).
    /// </summary>
    public Result<VerificationToken> IssueVerificationToken(
        TokenPurpose purpose,
        string token,
        TimeSpan ttl,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(token))
        {
            return UserErrors.VerificationTokenRequired;
        }

        if (ttl <= TimeSpan.Zero)
        {
            return UserErrors.VerificationTokenTtlMustBePositive;
        }

        var now = clock.UtcNow;

        foreach (var existing in _tokens.Where(t => t.Purpose == purpose && t.IsActive))
        {
            existing.Invalidate(now);
            Raise(new VerificationTokenInvalidatedDomainEvent(Id, existing.Id, purpose, now));
        }

        var newToken = new VerificationToken(
            Guid.NewGuid(), purpose, token, now, now.Add(ttl));
        _tokens.Add(newToken);
        UpdatedAt = now;
        Raise(new VerificationTokenIssuedDomainEvent(
            Id, newToken.Id, purpose, token, newToken.ExpiresAt, now));

        return newToken;
    }

    /// <summary>
    /// Consumes the verification token matching <paramref name="rawToken"/> for purpose
    /// <see cref="TokenPurpose.UserEmailVerification"/>, marks the email as verified and emits
    /// the corresponding domain event. Idempotent: re-verifying an already-verified user is a
    /// no-op when the token is missing or matches an already-consumed token of this user.
    /// </summary>
    public Result VerifyEmail(string rawToken, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return UserErrors.VerificationTokenRequired;
        }

        if (IsEmailVerified)
        {
            // Idempotent: don't fail double-clicks once the user is already verified.
            return Result.Success();
        }

        var token = _tokens.FirstOrDefault(
            t => t.Purpose == TokenPurpose.UserEmailVerification && t.Token == rawToken);

        if (token is null)
        {
            return UserErrors.VerificationTokenInvalid;
        }

        if (token.IsInvalidated)
        {
            return UserErrors.VerificationTokenInvalidated;
        }

        if (token.IsConsumed)
        {
            return UserErrors.VerificationTokenAlreadyConsumed;
        }

        var now = clock.UtcNow;
        if (token.IsExpired(now))
        {
            return UserErrors.VerificationTokenExpired;
        }

        token.Consume(now);
        EmailVerifiedAt = now;
        UpdatedAt = now;
        Raise(new UserEmailVerifiedDomainEvent(Id, now));
        return Result.Success();
    }

    /// <summary>
    /// Validates a sign-in attempt. Order matters for anti-enumeration: the password is
    /// checked first, so a wrong password always returns <see cref="UserErrors.InvalidCredentials"/>
    /// regardless of account state. Only when the password is correct does the response reveal
    /// whether the account is disabled or unverified — and at that point the caller already had
    /// the credentials, so leaking state is acceptable in exchange for a useful UX message.
    ///
    /// The hash verification is delegated to the caller via <paramref name="verifyHash"/> so the
    /// domain stays unaware of the hashing algorithm (lives in the infrastructure layer behind
    /// <c>IPasswordHasher</c>).
    /// </summary>
    public Result Authenticate(Func<string, bool> verifyHash, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(verifyHash);
        ArgumentNullException.ThrowIfNull(clock);

        if (!verifyHash(PasswordHash))
        {
            return UserErrors.InvalidCredentials;
        }

        if (IsDisabled)
        {
            return UserErrors.AccountDisabled;
        }

        if (!IsEmailVerified)
        {
            return UserErrors.EmailNotVerified;
        }

        Raise(new UserSignedInDomainEvent(Id, clock.UtcNow));
        return Result.Success();
    }

    public Result Disable(Guid disabledBy, string reason, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(reason))
        {
            return UserErrors.DisableReasonRequired;
        }

        if (IsDisabled)
        {
            return UserErrors.AlreadyDisabled;
        }

        var now = clock.UtcNow;
        DisabledAt = now;
        DisabledReason = reason;
        DisabledBy = disabledBy;
        UpdatedAt = now;
        Raise(new UserDisabledDomainEvent(Id, disabledBy, reason, now));
        return Result.Success();
    }

    public Result Restore(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsDisabled)
        {
            return UserErrors.NotDisabled;
        }

        var now = clock.UtcNow;
        DisabledAt = null;
        DisabledReason = null;
        DisabledBy = null;
        UpdatedAt = now;
        Raise(new UserRestoredDomainEvent(Id, now));
        return Result.Success();
    }
}
