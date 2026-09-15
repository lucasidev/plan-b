import Link from 'next/link';
import type { CareerCoverage } from '@/features/browse-catalog';
import { describeCareerReviews } from '../lib/describe-institution-careers';

/**
 * "Por dónde empezar" (SC-005, `V.university().aside` de la maqueta aprobada): las carreras de la
 * institución con reseñas, de más a menos (dato, no conveniencia). Si ninguna tiene reseñas
 * todavía, la sección no se dibuja.
 */
export function CareersStartHere({ coverage }: { coverage: CareerCoverage[] }) {
  const withReviews = coverage
    .filter((career) => career.voiceCount > 0)
    .sort((a, b) => b.voiceCount - a.voiceCount);

  if (withReviews.length === 0) return null;

  const isOnlyOne = withReviews.length === 1;

  return (
    <div className="pb-section min-w-0">
      <div className="pb-eyebrow">Por dónde empezar</div>
      <div className="pb-list">
        {withReviews.map((career) => (
          <Link
            key={career.careerId}
            href={`/careers/${career.careerId}`}
            // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
            prefetch={false}
            className="pb-row"
          >
            <span>
              <span className="pb-name">{career.careerName}</span>
              <span className="pb-sub">{startHereSubtitle(career, isOnlyOne)}</span>
            </span>
            <span className="pb-right pb-muted" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * La línea bajo el nombre (`V.university().aside` línea 495 de la maqueta aprobada): con una
 * sola carrera con reseñas en toda la institución, "la única carrera con reseñas por ahora"; con
 * varias, su propio conteo. La parte de materias solo va si la carrera tiene alguna cargada.
 */
function startHereSubtitle(career: CareerCoverage, isOnlyOne: boolean): string {
  const reviewsPart = isOnlyOne
    ? 'la única carrera con reseñas por ahora'
    : (describeCareerReviews(career) ?? '');

  if (career.totalSubjects === 0) return reviewsPart;
  return `${reviewsPart} · ${career.coveredSubjects} de ${career.totalSubjects} materias`;
}
