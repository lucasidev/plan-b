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
    /// El mail de cada cuenta pedida, por id (US-198). Caller: el catálogo de frases del backoffice,
    /// que muestra quién hizo el último cambio de cada frase y solo guarda el id de la cuenta.
    ///
    /// <para>
    /// En batch y no de a uno: el catálogo son decenas de filas y resolverlas fila por fila es el
    /// N+1 que ADR-0087 evita. Una cuenta que ya no existe simplemente no viene en el diccionario.
    /// </para>
    /// </summary>
    Task<IReadOnlyDictionary<Guid, string>> GetEmailsAsync(
        IReadOnlyCollection<Guid> userIds, CancellationToken ct = default);
}
