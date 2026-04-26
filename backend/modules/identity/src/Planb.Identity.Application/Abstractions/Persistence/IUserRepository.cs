using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Persistence;

public interface IUserRepository
{
    void Add(User user);

    Task<bool> ExistsByEmailAsync(EmailAddress email, CancellationToken ct = default);

    Task<User?> FindByIdAsync(UserId id, CancellationToken ct = default);

    Task<User?> FindByVerificationTokenAsync(
        string rawToken,
        TokenPurpose purpose,
        CancellationToken ct = default);
}
