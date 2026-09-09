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
}
