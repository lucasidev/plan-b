namespace Planb.Identity.Application.Contracts;

/// <summary>
/// Read-side de Identity exportado a otros bounded contexts (ADR-0017: cross-BC reads via
/// Contracts, sin FK Postgres ni nav EF cross-schema).
///
/// Distinto de <c>IIdentityReadService</c> (que vive en <c>Abstractions/Reading/</c>): aquel es
/// para uso interno del módulo (handlers locales, jobs); este es el contract público que otros
/// módulos pueden importar sin acoplarse a aggregates de Identity.
///
/// Mantener mínimo. Solo agregar métodos cuando un caller real los necesite.
/// </summary>
public interface IIdentityQueryService
{
    /// <summary>
    /// Devuelve el <see cref="StudentProfileSummary"/> activo del user, o null si el user no
    /// tiene profile (todavía no completó onboarding) o si está disabled/expirado.
    ///
    /// Caller principal: handler de US-013 (cargar historial) que necesita validar
    ///   1) el user tiene profile (cierre del onboarding),
    ///   2) el profile está activo,
    ///   3) saber el <c>CareerPlanId</c> para validar que la subject pertenece al plan vía
    ///      <c>IAcademicQueryService.IsSubjectInPlanAsync</c>.
    /// </summary>
    Task<StudentProfileSummary?> GetStudentProfileForUserAsync(
        Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Devuelve el <see cref="StudentProfileSummary"/> por su id. Caller principal: el worker
    /// de US-014 (procesar import de historial) que tiene el <c>studentProfileId</c> guardado
    /// en el aggregate <c>HistorialImport</c> y necesita resolver <c>UserId</c> + <c>CareerPlanId</c>
    /// sin re-hacer login del user.
    /// </summary>
    Task<StudentProfileSummary?> GetStudentProfileByIdAsync(
        Guid studentProfileId, CancellationToken ct = default);
}
