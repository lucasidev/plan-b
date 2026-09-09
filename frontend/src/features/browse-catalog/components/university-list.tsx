import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { describeUniversityCoverage } from '../lib/describe-career-coverage';
import type { UniversityWithCoverage } from '../types';

/**
 * Listado de universidades del catálogo (US-001, `/universities`). Cada fila navega a
 * `/universities/{slug}/careers` y dice, antes del clic, cuántas carreras tiene y cuántas de esas
 * tienen algo para leer (US-222, ficha de SC-003): el mismo hueco que dejaba clickear a ciegas
 * para saber si hay algo adentro. No hay estado "vacío" real esperado (el catálogo siempre tiene
 * al menos las universidades seedeadas), pero lo contemplamos igual: MVP sin admin de
 * universidades activo, esto puede pasar en un ambiente recién levantado.
 */
export function UniversityList({ universities }: { universities: UniversityWithCoverage[] }) {
  if (universities.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">
        Todavía no hay universidades cargadas en el catálogo.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {universities.map((university) => (
        <li key={university.id}>
          <Link
            href={`/universities/${university.slug}/careers`}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-ink">{university.name}</span>
              <span className="mt-0.5 block text-[12px] text-ink-3">
                {describeUniversityCoverage(
                  university.careerCount,
                  university.careersWithSomethingToRead,
                )}
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
