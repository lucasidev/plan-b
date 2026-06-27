using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Persistence;

/// <summary>
/// Write-side del aggregate <see cref="TeacherProfile"/> (US-030). Los cambios se stagean acá y se
/// commitean vía <see cref="IIdentityUnitOfWork"/> (mismo patrón que <see cref="IUserRepository"/>).
/// </summary>
public interface ITeacherProfileRepository
{
    void Add(TeacherProfile profile);

    /// <summary>
    /// ¿El user ya tiene un claim sobre este docente? Enforce app-level del invariante
    /// <c>UNIQUE(user_id, teacher_id)</c> para devolver un 409 limpio antes de que el índice de DB
    /// lo rechace.
    /// </summary>
    Task<bool> ExistsForUserAndTeacherAsync(
        UserId userId, Guid teacherId, CancellationToken ct = default);
}
