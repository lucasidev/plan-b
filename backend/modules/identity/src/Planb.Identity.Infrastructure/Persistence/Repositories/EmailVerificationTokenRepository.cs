using Microsoft.EntityFrameworkCore;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.EmailVerifications;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Identity.Infrastructure.Persistence.Repositories;

internal sealed class EmailVerificationTokenRepository : IEmailVerificationTokenRepository
{
    private readonly IdentityDbContext _db;
    private readonly IDateTimeProvider _clock;

    public EmailVerificationTokenRepository(IdentityDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public void Add(EmailVerificationToken token) => _db.EmailVerificationTokens.Add(token);

    public Task<EmailVerificationToken?> FindByTokenAsync(
        string token, CancellationToken ct = default) =>
        _db.EmailVerificationTokens.FirstOrDefaultAsync(t => t.Token == token, ct);

    public Task<EmailVerificationToken?> FindLatestActiveForUserAsync(
        UserId userId, CancellationToken ct = default)
    {
        var now = _clock.UtcNow;
        return _db.EmailVerificationTokens
            .Where(t => t.UserId == userId
                        && t.ConsumedAt == null
                        && t.ExpiresAt > now)
            .OrderByDescending(t => t.IssuedAt)
            .FirstOrDefaultAsync(ct);
    }
}
