import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui';
import {
  describeUniversityCareerCount,
  describeUniversityReviewsPill,
} from '../lib/describe-career-coverage';
import type { UniversityWithCoverage } from '../types';

/** Una universidad lista para la fila de `/universities` (ADR-0096): su cobertura, más su tipo institucional cuando lo relevamos. */
export type UniversityListItem = UniversityWithCoverage & {
  /** El primer segmento del `institution_type` Published (ej. "Privada"), o null sin dato. */
  institutionType: string | null;
};

/**
 * Listado de universidades del catálogo (US-001, `/universities`, ADR-0096). Cada fila navega a
 * `/universities/{slug}/careers` y dice, antes del clic: su tipo institucional cuando lo relevamos,
 * cuántas carreras tiene, y con una pill, cuántas de esas ya tienen reseñas (US-222, ficha de
 * SC-003). No hay estado "vacío" real esperado (el catálogo siempre tiene al menos las
 * universidades seedeadas), pero lo contemplamos igual: MVP sin admin de universidades activo,
 * esto puede pasar en un ambiente recién levantado.
 */
export function UniversityList({ universities }: { universities: UniversityListItem[] }) {
  if (universities.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">
        Todavía no hay universidades cargadas en el catálogo.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {universities.map((university) => {
        const careerCount = describeUniversityCareerCount(university.careerCount);
        const meta =
          university.careerCount > 0 && university.institutionType
            ? `${university.institutionType} · ${careerCount}`
            : careerCount;

        return (
          <li key={university.id}>
            <Link
              href={`/universities/${university.slug}/careers`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-ink">{university.name}</span>
                <span className="mt-0.5 block text-[12px] text-ink-3">{meta}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Pill tone={university.careersWithReviews > 0 ? 'good' : 'neutral'}>
                  {describeUniversityReviewsPill(university.careersWithReviews)}
                </Pill>
                <ChevronRight size={16} className="text-ink-3" aria-hidden />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
