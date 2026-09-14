import Link from 'next/link';
import { Pill } from '@/components/ui';
import { hasReviews } from '../lib/describe-career-coverage';
import type { CanonicalCareerGroup } from '../lib/group-careers-by-canonical';

/**
 * "En más de una institución" (US-222, ADR-0096, maqueta aprobada): una fila por carrera canónica
 * dictada en dos o más instituciones, para comparar lado a lado. El nombre canónico va arriba;
 * cada institución (nombre corto) es su propio link a su oferta, porque un grupo no tiene una
 * única carrera a la que mandar el click. Las pills a la derecha resumen el grupo entero, nunca
 * una por oferta (eso vivía en `CareerReviewsPill`, que esta fila reemplaza).
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
    <section aria-labelledby="canonical-groups-heading">
      <h2 id="canonical-groups-heading" className="font-display text-[16px] font-semibold text-ink">
        En más de una institución
      </h2>
      <p className="mt-0.5 text-[12px] text-ink-3">para comparar lado a lado</p>
      <ul className="mt-3 flex flex-col gap-2">
        {groups.map((group) => {
          const anyReviewed = group.offerings.some(hasReviews);

          return (
            <li
              key={group.canonicalGroupName}
              className="rounded-lg border border-line bg-bg-card px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-ink">{group.canonicalGroupName}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {group.offerings.map((offering, index) => (
                      <span key={offering.careerId}>
                        {index > 0 && ' · '}
                        <Link
                          href={`/careers/${offering.careerId}`}
                          prefetch={false}
                          className="hover:text-ink hover:underline"
                        >
                          {universityShortNames.get(offering.universityId) ??
                            offering.universityName}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  {anyReviewed && <Pill tone="ink">con reseñas</Pill>}
                  <Pill>
                    {group.offerings.length}{' '}
                    {group.offerings.length === 1 ? 'institución' : 'instituciones'}
                  </Pill>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
