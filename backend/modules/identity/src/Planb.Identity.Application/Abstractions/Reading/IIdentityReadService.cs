using Planb.Identity.Application.Features.GetStudentProfile;
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

    /// <summary>
    /// Devuelve el StudentProfile asociado a un user (uno por user en el modelo MVP, ver
    /// US-012). Null si el user no tiene profile aún. Caller principal: GET /api/me/student-profiles
    /// (US-037) para el guard del layout (member) "user tiene profile" que decide entre /home
    /// y /onboarding/welcome.
    /// </summary>
    Task<StudentProfileResponse?> GetStudentProfileByUserIdAsync(
        UserId userId,
        CancellationToken ct = default);
}
