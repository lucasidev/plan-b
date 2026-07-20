import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { University } from '../types';

/**
 * Listado de universidades del catálogo (US-001, `/universities`). Cada fila navega a
 * `/universities/{slug}/careers`. No hay estado "vacío" real esperado (el catálogo siempre
 * tiene al menos las universidades seedeadas), pero lo contemplamos igual: MVP sin admin de
 * universidades activo, esto puede pasar en un ambiente recién levantado.
 */
export function UniversityList({ universities }: { universities: University[] }) {
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
            <span className="text-[14px] font-medium text-ink">{university.name}</span>
            <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
