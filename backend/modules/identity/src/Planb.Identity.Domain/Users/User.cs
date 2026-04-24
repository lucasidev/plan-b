using Planb.Identity.Domain.Users.Events;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Aggregate root for an authenticated account. See ADR-0008 for role semantics.
/// The aggregate treats <see cref="PasswordHash"/> as an opaque string — the hashing algorithm
/// lives in the infrastructure layer (see the PasswordHasher port).
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
    /// Idempotent — verifying an already-verified user is a no-op (no state, timestamp, or event change).
    /// </summary>
    public void MarkEmailVerified(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsEmailVerified)
        {
            return;
        }

        var now = clock.UtcNow;
        EmailVerifiedAt = now;
        UpdatedAt = now;
        Raise(new UserEmailVerifiedDomainEvent(Id, now));
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
