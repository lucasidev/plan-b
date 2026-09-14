import Link from 'next/link';
import type { CareerCoverage } from '@/features/browse-catalog';
import { describeCareerReviews } from '../lib/describe-institution-careers';

/**
 * "Por dónde empezar" (SC-005): las carreras de la institución con reseñas, de más a menos (dato,
 * no conveniencia). Si ninguna tiene reseñas todavía, la sección no se dibuja.
 */
export function CareersStartHere({ coverage }: { coverage: CareerCoverage[] }) {
  const withReviews = coverage
    .filter((career) => career.voiceCount > 0)
    .sort((a, b) => b.voiceCount - a.voiceCount);

  if (withReviews.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-[12px] text-ink-3">Por dónde empezar</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {withReviews.map((career, index) => (
          <div
            key={career.careerId}
            className={`py-2.5 ${index === withReviews.length - 1 ? '' : 'border-b border-line-2'}`}
          >
            <Link
              href={`/careers/${career.careerId}`}
              // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
              prefetch={false}
              className="text-[13.5px] text-ink underline-offset-2 hover:underline"
            >
              {career.careerName}
            </Link>
            <p className="mt-1 text-[11px] text-ink-3">{describeCareerReviews(career)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
