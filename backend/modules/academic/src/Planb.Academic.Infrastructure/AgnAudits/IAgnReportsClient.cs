using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// Trae los informes de la AGN (issue #506). La API es JSON:API de Drupal, pagina de a diez y sus
/// parámetros <c>filter[...]</c> no filtran la vista (comprobado el 2026-09-08 contra la API real):
/// hay que traer las páginas enteras y filtrar por <c>organismo_auditado</c> en local, así que la
/// única operación que expone es "traeme todo".
/// </summary>
public interface IAgnReportsClient
{
    /// <summary>
    /// Pagina la API entera y devuelve la lista completa. Cualquier falla (HTTP, timeout, JSON
    /// con una forma inesperada) vuelve como <see cref="Result{T}.IsFailure"/>, nunca como
    /// excepción: un tercero que no responde no puede tumbar a quien llama.
    /// </summary>
    Task<Result<IReadOnlyList<AgnReport>>> FetchAllReportsAsync(CancellationToken ct = default);
}
