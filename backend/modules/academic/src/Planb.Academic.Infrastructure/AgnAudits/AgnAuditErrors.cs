using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>Errores del import de auditorías de la AGN (issue #506): siempre <see cref="ErrorType.Problem"/>, un tercero que no responde no es una falla de validación de nuestro dominio.</summary>
public static class AgnAuditErrors
{
    public static Error FetchFailed(string detail) =>
        Error.Problem(
            "academic.agn_audit.fetch_failed",
            $"No se pudo traer los informes de la AGN: {detail}");

    /// <summary>
    /// El informe elegido como "el más reciente" de un organismo que sí nos interesa no trae
    /// título, año o link: no hay con qué armar una afirmación Published sin inventar el dato.
    /// </summary>
    public static Error IncompleteReport(int organismoId) =>
        Error.Problem(
            "academic.agn_audit.incomplete_report",
            $"El informe más reciente del organismo {organismoId} no trae título, año o link.");

    /// <summary>
    /// El control (issue #506, "la trampa"; ver <see cref="AgnAuditSanityCheck"/>) volvió vacío: la
    /// API respondería igual si el filtro estuviera mal armado, así que no hay forma de distinguir
    /// eso de que la UNT realmente se quedó sin auditorías. No se cargó nada.
    /// </summary>
    public static Error SanityCheckFailed() =>
        Error.Problem(
            "academic.agn_audit.sanity_check_failed",
            "El control (UNT) no devolvió informes: la consulta a la AGN no es confiable ahora mismo, no se cargó nada.");
}
