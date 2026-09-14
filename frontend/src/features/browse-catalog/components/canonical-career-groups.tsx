import Link from 'next/link';
import type { CanonicalCareerGroup } from '../lib/group-careers-by-canonical';
import { CareerReviewsPill } from './career-reviews-pill';

/**
 * "En más de una institución" (US-222, ADR-0096): un bloque por carrera canónica dictada en dos o
 * más instituciones, para comparar lado a lado. Cada oferta lleva el nombre con el que esa
 * institución la dicta (puede variar entre instituciones), su institución, y su estado de reseñas.
 */
export function CanonicalCareerGroups({ groups }: { groups: CanonicalCareerGroup[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="canonical-groups-heading">
      <h2 id="canonical-groups-heading" className="font-display text-[16px] font-semibold text-ink">
        En más de una institución
      </h2>
      <p className="mt-0.5 text-[12px] text-ink-3">para comparar lado a lado</p>
      <div className="mt-3 flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.canonicalGroupName}>
            <h3 className="text-[13px] font-medium text-ink-2">{group.canonicalGroupName}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {group.offerings.map((offering) => (
                <li key={offering.careerId}>
                  <Link
                    href={`/careers/${offering.careerId}`}
                    prefetch={false}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3 transition-colors hover:bg-bg-elev"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium text-ink">
                        {offering.careerName}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-3">
                        {offering.universityName}
                      </span>
                    </span>
                    <CareerReviewsPill career={offering} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
