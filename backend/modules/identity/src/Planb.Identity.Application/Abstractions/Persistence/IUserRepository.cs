using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Persistence;

public interface IUserRepository
{
    void Add(User user);

    Task<bool> ExistsByEmailAsync(EmailAddress email, CancellationToken ct = default);

    Task<User?> FindByEmailAsync(EmailAddress email, CancellationToken ct = default);

    Task<User?> FindByIdAsync(UserId id, CancellationToken ct = default);

    Task<User?> FindByVerificationTokenAsync(
        string rawToken,
        TokenPurpose purpose,
        CancellationToken ct = default);

    /// <summary>
    /// Finds the user that owns a verification token with the given raw value, regardless of
    /// purpose. Used by the password-reset flow so the aggregate can distinguish between
    /// "token does not exist" (404) and "token exists but is for a different purpose" (409).
    /// </summary>
    Task<User?> FindByRawVerificationTokenAsync(
        string rawToken,
        CancellationToken ct = default);
}
