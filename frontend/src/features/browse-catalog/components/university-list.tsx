import Link from 'next/link';
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
 * Listado de universidades del catálogo (US-001, `/universities`, ADR-0096, maqueta aprobada):
 * filas `.pb-row` (sin chevron), la pill oscura `.pb-pill.pb-pub` cuando tiene reseñas, la clara
 * `.pb-pill` cuando no, y `.pb-row.pb-dim` atenúa el nombre de la fila sin reseñas. Cada fila
 * navega a `/universities/{slug}/careers` y dice, antes del clic: su tipo institucional cuando lo
 * relevamos, cuántas carreras tiene, y cuántas de esas ya tienen reseñas (US-222, ficha de
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
    <ul className="pb-list">
      {universities.map((university) => {
        const careerCount = describeUniversityCareerCount(university.careerCount);
        const meta =
          university.careerCount > 0 && university.institutionType
            ? `${university.institutionType} · ${careerCount}`
            : careerCount;
        const reviewed = university.careersWithReviews > 0;

        return (
          <li key={university.id}>
            <Link
              href={`/universities/${university.slug}/careers`}
              className={reviewed ? 'pb-row' : 'pb-row pb-dim'}
            >
              <span>
                <span className="pb-name">{university.name}</span>
                <span className="pb-sub">{meta}</span>
              </span>
              <span className="pb-right">
                <span className={reviewed ? 'pb-pill pb-pub' : 'pb-pill'}>
                  {describeUniversityReviewsPill(university.careersWithReviews)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
