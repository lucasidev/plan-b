import Link from 'next/link';
import type { CareerCoverage } from '../types';
import { CareerReviewsPill } from './career-reviews-pill';

/**
 * "En una sola institución" (US-222, ADR-0096): el resto del catálogo, lo que no comparte carrera
 * canónica con nadie más. Lista compacta, alfabética por nombre de carrera (US-171), con el mismo
 * estado de reseñas que "En más de una institución": sin cobertura acá, eso vive en la ficha.
 */
export function SingleInstitutionCareerList({ careers }: { careers: CareerCoverage[] }) {
  if (careers.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="single-institution-heading">
      <h2
        id="single-institution-heading"
        className="font-display text-[16px] font-semibold text-ink"
      >
        En una sola institución
      </h2>
      <ul className="mt-3 flex flex-col gap-1.5">
        {careers.map((career) => (
          <li key={career.careerId}>
            <Link
              href={`/careers/${career.careerId}`}
              prefetch={false}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-bg-elev"
            >
              <span className="min-w-0">
                <span className="font-medium text-ink">{career.careerName}</span>
                <span className="text-ink-3"> · {career.universityName}</span>
              </span>
              <CareerReviewsPill career={career} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
