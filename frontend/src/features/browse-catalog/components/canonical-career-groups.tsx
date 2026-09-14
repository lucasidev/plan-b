import Link from 'next/link';
import { hasReviews } from '../lib/describe-career-coverage';
import type { CanonicalCareerGroup } from '../lib/group-careers-by-canonical';

/**
 * Orden de exhibición de "En más de una institución" (ADR-0096, maqueta aprobada): primero las
 * que tienen reseñas, después las que dictan más instituciones, y a igual cantidad, alfabético.
 * No toca `groupCareersByCanonical` (esa agrupación se queda): ordena lo que ya agrupó, para
 * mostrar.
 */
function sortForDisplay(groups: readonly CanonicalCareerGroup[]): CanonicalCareerGroup[] {
  return [...groups].sort((a, b) => {
    const aReviewed = a.offerings.some(hasReviews);
    const bReviewed = b.offerings.some(hasReviews);
    if (aReviewed !== bReviewed) return aReviewed ? -1 : 1;
    if (a.offerings.length !== b.offerings.length) return b.offerings.length - a.offerings.length;
    return a.canonicalGroupName.localeCompare(b.canonicalGroupName, 'es');
  });
}

/**
 * "En más de una institución" (US-222, ADR-0096, maqueta aprobada): una fila `.pb-row` por
 * carrera canónica dictada en dos o más instituciones, para comparar lado a lado. El nombre
 * canónico va arriba; cada institución (nombre corto) es su propio link a su oferta, porque un
 * grupo no tiene una única carrera a la que mandar el click (la maqueta sí, porque no tiene
 * rutas reales: ahí la fila entera es un botón a un solo destino de demo). Las pills a la derecha
 * resumen el grupo entero, nunca una por oferta (eso vivía en `CareerReviewsPill`).
 */
export function CanonicalCareerGroups({
  groups,
  universityShortNames,
}: {
  groups: CanonicalCareerGroup[];
  universityShortNames: ReadonlyMap<string, string>;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="pb-section" aria-labelledby="canonical-groups-heading">
      <h2 id="canonical-groups-heading" className="pb-eyebrow">
        En más de una institución · para comparar lado a lado
      </h2>
      <ul className="pb-list">
        {sortForDisplay(groups).map((group) => {
          const anyReviewed = group.offerings.some(hasReviews);

          return (
            <li key={group.canonicalGroupName} className={anyReviewed ? 'pb-row' : 'pb-row pb-dim'}>
              <span>
                <span className="pb-name">{group.canonicalGroupName}</span>
                <span className="pb-sub">
                  {group.offerings.map((offering, index) => (
                    <span key={offering.careerId}>
                      {index > 0 && ' · '}
                      <Link
                        href={`/careers/${offering.careerId}`}
                        prefetch={false}
                        className="pb-link"
                      >
                        {universityShortNames.get(offering.universityId) ?? offering.universityName}
                      </Link>
                    </span>
                  ))}
                </span>
              </span>
              <span className="pb-right">
                {anyReviewed && <span className="pb-pill pb-pub">con reseñas</span>}
                <span className="pb-pill">
                  {group.offerings.length}{' '}
                  {group.offerings.length === 1 ? 'institución' : 'instituciones'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
