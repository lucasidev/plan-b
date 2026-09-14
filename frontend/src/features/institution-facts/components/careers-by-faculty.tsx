import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui';
import type { Career, CareerCoverage } from '@/features/browse-catalog';
import { describeCareerReviews } from '../lib/describe-institution-careers';
import { groupCareersByFaculty } from '../lib/group-careers-by-faculty';

/**
 * "Facultades y carreras" (SC-005): las carreras de la institución agrupadas por facultad, cada
 * una con link a su ficha y cuántas reseñas junta (`describeCareerReviews`). Muestra todas las
 * carreras (oficiales y crowdsourced, US-088): las no oficiales llevan el badge "No oficial" en
 * vez de ocultarse.
 */
export function CareersByFaculty({
  careers,
  coverage,
}: {
  careers: Career[];
  coverage: CareerCoverage[];
}) {
  if (careers.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">Esta universidad todavía no tiene carreras cargadas.</p>
    );
  }

  const coverageByCareerId = new Map(coverage.map((c) => [c.careerId, c]));
  const groups = groupCareersByFaculty(careers);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="mb-2 text-[12px] text-ink-3">{group.name}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {group.careers.map((career) => {
              const reviews = describeCareerReviews(coverageByCareerId.get(career.id));
              return (
                <li key={career.id}>
                  <Link
                    href={`/careers/${career.id}`}
                    // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
                    prefetch={false}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
                  >
                    <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                      {career.name}
                      {!career.isOfficial && <Pill>No oficial</Pill>}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {reviews && <span className="text-[12px] text-ink-3">{reviews}</span>}
                      <ChevronRight size={16} className="text-ink-3" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
