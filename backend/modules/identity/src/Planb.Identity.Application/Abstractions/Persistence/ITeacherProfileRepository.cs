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

    /// <summary>Carga un claim por id (tracked, con sus tokens) para el flow de verificación (US-031).</summary>
    Task<TeacherProfile?> FindByIdAsync(TeacherProfileId id, CancellationToken ct = default);

    /// <summary>
    /// Carga el claim dueño de un token de verificación institucional con ese valor crudo (tracked,
    /// con tokens). Para el endpoint que consume el link de mail. Null si no existe.
    /// </summary>
    Task<TeacherProfile?> FindByVerificationTokenAsync(
        string rawToken, CancellationToken ct = default);

    /// <summary>
    /// ¿Hay algún TeacherProfile ya verificado para este docente? El handler de verify lo chequea
    /// antes de marcar verificado (partial UNIQUE teacher WHERE verified; dos members pueden tener
    /// claims pending al mismo docente, solo uno termina verified).
    /// </summary>
    Task<bool> AnyVerifiedForTeacherAsync(Guid teacherId, CancellationToken ct = default);
}
