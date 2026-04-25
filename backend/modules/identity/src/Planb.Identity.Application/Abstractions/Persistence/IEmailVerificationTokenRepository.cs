using Planb.Identity.Domain.EmailVerifications;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Persistence;

public interface IEmailVerificationTokenRepository
{
    void Add(EmailVerificationToken token);

    Task<EmailVerificationToken?> FindByTokenAsync(string token, CancellationToken ct = default);

    Task<EmailVerificationToken?> FindLatestActiveForUserAsync(
        UserId userId, CancellationToken ct = default);
}
