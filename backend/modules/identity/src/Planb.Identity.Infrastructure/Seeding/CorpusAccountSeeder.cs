using Microsoft.EntityFrameworkCore;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Identity.Infrastructure.Seeding;

/// <summary>Materializa las cuentas sintéticas sin credenciales ni eventos de registro.</summary>
public sealed class CorpusAccountSeeder(IdentityDbContext db)
{
    public const string PasswordSentinel = User.CorpusPasswordSentinel;

    public async Task SeedAsync(IEnumerable<CorpusAccount> accounts, CancellationToken ct = default)
    {
        foreach (var account in accounts)
        {
            var id = new UserId(account.Id);
            var existing = await db.Users.SingleOrDefaultAsync(u => u.Id == id, ct);
            if (existing is not null)
            {
                if (existing.Email.Value != account.Email || !existing.IsEmailVerified ||
                    !existing.IsDisabled || existing.PasswordHash != PasswordSentinel ||
                    existing.Role != UserRole.Member || existing.IsDeactivated || existing.IsExpired ||
                    existing.CreatedAt != account.CreatedAt ||
                    !existing.StudentProfiles.Any(p => p.IsActive &&
                        p.CareerPlanId == account.CareerPlanId && p.CareerId == account.CareerId))
                {
                    throw new InvalidOperationException($"Corpus account {account.Id} conflicts with existing data.");
                }
                continue;
            }

            var email = EmailAddress.Create(account.Email).Value;
            if (await db.Users.AnyAsync(u => u.Email == email &&
                u.ExpiredAt == null && u.DeactivatedAt == null, ct))
            {
                throw new InvalidOperationException($"Corpus email {account.Email} belongs to another account.");
            }

            var clock = new SeedClock(account.CreatedAt);
            var user = User.Register(email, PasswordSentinel, clock).Value;
            // El ID del seed pertenece a persistencia: conserva las referencias de las reseñas ya sembradas.
            db.Entry(user).Property(u => u.Id).CurrentValue = id;
            var token = Guid.NewGuid().ToString("N");
            user.IssueVerificationToken(TokenPurpose.UserEmailVerification, token, TimeSpan.FromHours(1), clock);
            user.VerifyEmail(token, clock);
            var profile = user.AddStudentProfile(account.CareerPlanId, account.CareerId, null, clock);
            if (profile.IsFailure)
            {
                throw new InvalidOperationException($"Corpus profile could not be created: {profile.Error.Code}.");
            }
            user.Disable(account.Id, "Synthetic demonstration corpus account", clock);
            user.ClearDomainEvents();
            db.Users.Add(user);
        }

        await db.SaveChangesAsync(ct);
    }

    private sealed class SeedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => now;
    }
}

public sealed record CorpusAccount(Guid Id, string Email, Guid CareerPlanId, Guid CareerId, DateTimeOffset CreatedAt);
