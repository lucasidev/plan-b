using System.Security.Cryptography;
using System.Text;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.DeactivateAccount;

/// <summary>
/// Handler del soft delete con anonimización (ADR-0044). Reemplaza al hard delete user-facing.
/// El user row sobrevive en DB con la PII anonimizada — las reseñas y demás contenido
/// crowdsourced que apunte al user (cuando aterricen, S5+) quedan visibles como "Ex-miembro".
///
/// <para>
/// El email anonimizado se computa acá (no en el aggregate) con SHA-256 determinístico del
/// email original lowercased: <c>deleted-&lt;sha256hex16&gt;@anonymized.local</c>. El hash
/// determinístico permite, en un script de soporte excepcional, identificar si dos cuentas
/// anonimizadas correspondían al mismo email (caso raro de investigación interna). El sufijo
/// <c>.local</c> garantiza que el email nunca sea enviable.
/// </para>
///
/// <para>
/// Antes de anonimizar, escribimos el <see cref="UserDeletionLog"/> con el email ORIGINAL
/// hasheado (mismo audit que el hard delete legacy). Es el único registro que sobrevive a la
/// anonimización: permite confirmar "este user existió y se dio de baja en esta fecha" sin
/// recuperar la identidad original.
/// </para>
///
/// <para>
/// Después del SaveChanges revocamos refresh tokens (Redis). Best-effort: una falla transient
/// de Redis no rollbackea un deactivate exitoso; los access tokens vivos vencen por su JWT
/// clock y los próximos refresh attempts caen 401 porque el user está deactivated.
/// </para>
/// </summary>
public static class DeactivateAccountCommandHandler
{
    public static async Task<Result> Handle(
        DeactivateAccountCommand command,
        IUserRepository users,
        IUserDeletionLogRepository deletionLogs,
        IIdentityUnitOfWork unitOfWork,
        IRefreshTokenStore refreshTokens,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByIdAsync(command.UserId, ct);
        if (user is null)
        {
            return UserErrors.NotFoundById;
        }

        if (user.IsDeactivated)
        {
            return UserErrors.AlreadyDeactivated;
        }

        // Audit con email original hasheado ANTES de anonimizar (después el aggregate ya no
        // tiene el email original). El factory de UserDeletionLog hashea internamente; no
        // persiste el email plano.
        var log = UserDeletionLog.Create(user.Id, user.Email, clock.UtcNow);
        deletionLogs.Add(log);

        var anonymizedEmail = AnonymizeEmail(user.Email.Value);
        var deactivateResult = user.Deactivate(anonymizedEmail, clock);
        if (deactivateResult.IsFailure)
        {
            return deactivateResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await refreshTokens.RevokeAllForUserAsync(user.Id, ct);

        return Result.Success();
    }

    /// <summary>
    /// Genera el shape del email anonimizado documentado en ADR-0044. SHA-256 determinístico
    /// (mismo email → mismo hash) para soportar investigación interna excepcional. Se trunca
    /// a 16 chars hex (64 bits de entropía) para mantener largo razonable; colisión a esa
    /// resolución solo importa si hay ~4 mil millones de deactivations, lejos de cualquier
    /// escala plausible.
    /// </summary>
    private static string AnonymizeEmail(string original)
    {
        var bytes = Encoding.UTF8.GetBytes(original.ToLowerInvariant());
        var hash = SHA256.HashData(bytes);
        var hex = Convert.ToHexString(hash, 0, 8).ToLowerInvariant(); // 16 chars
        return $"deleted-{hex}@anonymized.local";
    }
}
