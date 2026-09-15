import { FallbackLink } from '@/components/layout/fallback-link';
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
 * "En más de una institución" (US-222, ADR-0096, maqueta aprobada, línea 446): una fila `.pb-row`
 * por carrera canónica dictada en dos o más instituciones, para comparar lado a lado. El nombre
 * canónico va arriba; las instituciones (nombre corto) son texto plano unido por " · ", sin link
 * propio. La fila entera lleva a `/careers/{id}/where-to-study` con la primera oferta del grupo:
 * esa pantalla resuelve el grupo canónico entero a partir de cualquiera de sus ofertas, así que no
 * hace falta un destino distinto por institución. Las pills a la derecha resumen el grupo entero,
 * nunca una por oferta (eso vivía en `CareerReviewsPill`).
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
          const institutionNames = group.offerings
            .map(
              (offering) =>
                universityShortNames.get(offering.universityId) ?? offering.universityName,
            )
            .join(' · ');

          return (
            <li key={group.canonicalGroupName}>
              <FallbackLink
                href={`/careers/${group.offerings[0].careerId}/where-to-study`}
                prefetch={false}
                className={anyReviewed ? 'pb-row' : 'pb-row pb-dim'}
              >
                <span>
                  <span className="pb-name">{group.canonicalGroupName}</span>
                  <span className="pb-sub">{institutionNames}</span>
                </span>
                <span className="pb-right">
                  {anyReviewed && <span className="pb-pill pb-pub">con reseñas</span>}
                  <span className="pb-pill">
                    {group.offerings.length}{' '}
                    {group.offerings.length === 1 ? 'institución' : 'instituciones'}
                  </span>
                </span>
              </FallbackLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
