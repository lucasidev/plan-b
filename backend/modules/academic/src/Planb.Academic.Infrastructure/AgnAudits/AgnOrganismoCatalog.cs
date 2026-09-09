using Planb.Academic.Infrastructure.Seeding;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// Mapeo a mano de institución del catálogo a organismo de la AGN (issue #506). La relación
/// <c>organismo_auditado</c> de un informe apunta a un id interno de un padrón de 415 organismos
/// (<c>webagnapi.agn.gob.ar/api/taxonomy_term/organismo_auditado</c>) sin nada que buscar por
/// nombre de forma confiable (nombres en mayúsculas, sin criterio único), así que se resuelve una
/// sola vez, a mano, contra ese padrón y el selector del buscador de la web
/// (<c>agn.gob.ar/auditorias/buscador</c>). Comprobado el 2026-09-08:
///
/// <list type="bullet">
/// <item>UNT = 1140 ("UNIVERSIDAD NACIONAL DE TUCUMÁN (UNT)").</item>
/// <item>
/// UTN = 2409 ("UNIVERSIDAD TECNOLÓGICA NACIONAL"): la AGN audita a la universidad entera, no por
/// Facultad Regional, así que UTN-FRT usa este mismo id (mismo criterio que el anuario de la SPU,
/// que tampoco abre por regional).
/// </item>
/// </list>
///
/// UNSTA y San Pablo-T (privadas) y UNSE no están en el padrón: la AGN audita organismos con fondos
/// públicos nacionales. Si el catálogo suma una nacional nueva, esta búsqueda se repite a mano y su
/// fila se agrega acá; hasta entonces, cualquier institución sin fila es NotPublished
/// (<see cref="AgnAuditFactBuilder"/>), no un error.
/// </summary>
public static class AgnOrganismoCatalog
{
    private static readonly IReadOnlyDictionary<Guid, int> OrganismoIdsByUniversityId =
        new Dictionary<Guid, int>
        {
            [AcademicSeedData.Unt.Id.Value] = 1140,
            [AcademicSeedData.UtnFrt.Id.Value] = 2409,
        };

    public static int? TryGetOrganismoId(Guid universityId) =>
        OrganismoIdsByUniversityId.TryGetValue(universityId, out var organismoId) ? organismoId : null;
}
