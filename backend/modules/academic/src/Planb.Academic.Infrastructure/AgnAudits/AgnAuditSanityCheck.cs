using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// La trampa (issue #506): verificado contra la API real, un nombre de filtro equivocado responde
/// 200 con cero resultados, exactamente igual que "esta institución no tiene informes auditados". Un
/// error de tipeo se vuelve indistinguible de una afirmación fuerte sobre una universidad real, y
/// esa afirmación es la que el producto publica.
///
/// <para>
/// La defensa: antes de creer cualquier respuesta vacía, <see cref="AgnAuditImporter"/> consulta un
/// control que se sabe positivo (<see cref="AgnOrganismoCatalog.ControlOrganismoId"/>, la UNT) y
/// este chequeo decide si esa respuesta alcanza para confiar en el resto. Separado de
/// <see cref="AgnAuditImporter"/> (que necesita base para leer el catálogo) para poder testear la
/// decisión sola, con dobles, igual que <see cref="AgnAuditFactBuilder"/>.
/// </para>
/// </summary>
public static class AgnAuditSanityCheck
{
    public static Result Verify(IReadOnlyList<AgnReport> controlReports)
    {
        ArgumentNullException.ThrowIfNull(controlReports);
        return controlReports.Count > 0
            ? Result.Success()
            : AgnAuditErrors.SanityCheckFailed();
    }
}
