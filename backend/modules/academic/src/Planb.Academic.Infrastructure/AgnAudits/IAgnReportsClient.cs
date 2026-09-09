using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// Trae los informes de la AGN que auditan a un organismo puntual (issue #506). El endpoint del
/// recurso (<c>/api/node/informes</c>) sí filtra server-side por
/// <c>filter[organismo_auditado.drupal_internal__tid]</c> (comprobado el 2026-09-09 contra la API
/// real): una petición por organismo trae exactamente sus informes, no hace falta traer los 4816 y
/// filtrar en local.
/// </summary>
public interface IAgnReportsClient
{
    /// <summary>
    /// Los informes que auditan al organismo <paramref name="organismoId"/> (el id interno de
    /// taxonomía de la AGN, <see cref="AgnOrganismoCatalog"/>, no el id de la universidad en el
    /// catálogo). Una lista vacía es una respuesta válida: ese organismo no tiene informes
    /// publicados, no es una falla. Cualquier falla real (HTTP, timeout, JSON con una forma
    /// inesperada) vuelve como <see cref="Result{T}.IsFailure"/>, nunca como excepción: un tercero
    /// que no responde no puede tumbar a quien llama.
    /// </summary>
    Task<Result<IReadOnlyList<AgnReport>>> FetchReportsForOrganismoAsync(
        int organismoId, CancellationToken ct = default);
}
