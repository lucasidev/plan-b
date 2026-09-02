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
    /// ¿El user tiene un <c>TeacherProfile</c> verificado para este docente (US-040)? Caller: el
    /// handler de responder reseña, que solo deja responder a quien es el docente reseñado y está
    /// verificado (claim US-030 + verificación US-031). False si no hay claim, o lo hay pero sin
    /// verificar, o es de otro docente.
    /// </summary>
    Task<bool> HasVerifiedTeacherProfileAsync(
        Guid userId, Guid teacherId, CancellationToken ct = default);

    /// <summary>
    /// El mail de cada cuenta pedida, por id (US-198). Caller: el catálogo de ítems del backoffice,
    /// que muestra quién hizo el último cambio de cada ítem y solo guarda el id de la cuenta.
    ///
    /// <para>
    /// En batch y no de a uno: el catálogo son decenas de filas y resolverlas fila por fila es el
    /// N+1 que ADR-0087 evita. Una cuenta que ya no existe simplemente no viene en el diccionario.
    /// </para>
    /// </summary>
    Task<IReadOnlyDictionary<Guid, string>> GetEmailsAsync(
        IReadOnlyCollection<Guid> userIds, CancellationToken ct = default);
}
