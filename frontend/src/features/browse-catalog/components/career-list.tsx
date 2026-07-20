import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui';
import type { Career } from '../types';

/**
 * Listado de carreras de una universidad (US-001, `/universities/[slug]/careers`). Muestra
 * todas las carreras (oficiales y crowdsourced, US-088): las no oficiales llevan el badge
 * "No oficial" en vez de ocultarse.
 */
export function CareerList({ careers }: { careers: Career[] }) {
  if (careers.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">Esta universidad todavía no tiene carreras cargadas.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {careers.map((career) => (
        <li key={career.id}>
          <Link
            href={`/careers/${career.id}/plans`}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
          >
            <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
              {career.name}
              {!career.isOfficial && <Pill>No oficial</Pill>}
            </span>
            <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
