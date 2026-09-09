import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui';
import { describeCareerCoverage } from '../lib/describe-career-coverage';
import type { CareerCoverage } from '../types';

/**
 * Listado de carreras de la lente de Carreras (US-222, ficha de SC-003), con lo mínimo honesto de
 * cada una: sus datos oficiales, sus voces y su cobertura, para decidir si vale abrirla antes del
 * clic. Una carrera sin nada sigue en la lista (el vacío es información, US-139): nunca desaparece
 * ni muestra un puntaje.
 *
 * Distinto de `CareerList` (el listado simple de `/universities/[slug]/careers`, SC-005): esa
 * pantalla no es Explorar y su conteo agregado por carrera queda fuera de esta tarea (R6, #486).
 */
export function CareerCoverageList({ careers }: { careers: CareerCoverage[] }) {
  if (careers.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">Esta universidad todavía no tiene carreras cargadas.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {careers.map((career) => (
        <li key={career.careerId}>
          <Link
            href={`/careers/${career.careerId}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                {career.careerName}
                {!career.isOfficial && <Pill>No oficial</Pill>}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-3">
                {describeCareerCoverage(career)}
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
