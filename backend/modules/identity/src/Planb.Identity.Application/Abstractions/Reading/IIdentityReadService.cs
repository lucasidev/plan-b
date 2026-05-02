using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Reading;

/// <summary>
/// Read-side de Identity: queries Dapper que devuelven datos planos sin pasar por el aggregate.
/// Para reads que necesitan filtros / joins / paging que no se justifican en EF + aggregate.
/// La implementación vive en Planb.Identity.Infrastructure (ADR-0018).
/// </summary>
public interface IIdentityReadService
{
    /// <summary>
    /// Devuelve los <see cref="UserId"/> de registros candidatos a expirar: users sin verificar,
    /// no disabled, no expired (idempotencia), creados antes del <paramref name="cutoff"/>.
    /// El handler de <c>ExpireUnverifiedRegistrationsCommand</c> itera estos IDs y carga cada
    /// aggregate vía repo para llamar <c>User.ExpireRegistration</c>.
    /// </summary>
    Task<IReadOnlyList<UserId>> GetUnverifiedExpirationCandidatesAsync(
        DateTimeOffset cutoff,
        CancellationToken ct = default);
}
