'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { formatAcademicPeriod } from '@/lib/academic-terms';
import type { AcademicTerm } from '../types';

/**
 * Selector de período lectivo del planificador (US-096). Estado canónico en la URL (`?termId=`),
 * mismo patrón que `?tab=` de `PlanTabs`: cambiar el período navega, la RSC de /plan re-resuelve el
 * catálogo de materias con la oferta de comisiones de ese período. Usa el formateador canónico de
 * `@/lib/academic-terms`: nunca un formato codificado tipo "1c" (ADR-0051).
 */
export function TermSelector({
  terms,
  selectedTermId,
}: {
  terms: readonly AcademicTerm[];
  selectedTermId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (terms.length === 0) {
    return (
      <span className="text-ink-3" style={{ fontSize: 12 }}>
        Sin períodos lectivos cargados para tu universidad.
      </span>
    );
  }

  return (
    <label className="flex items-center gap-2">
      <span
        className="text-ink-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Período
      </span>
      <select
        aria-label="Período lectivo"
        value={selectedTermId ?? ''}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('termId', e.target.value);
          router.push(`?${params.toString()}`, { scroll: false });
        }}
        className="border border-line rounded"
        style={{ padding: '5px 10px', fontSize: 12.5, background: 'var(--bg)' }}
      >
        {terms.map((t) => (
          <option key={t.id} value={t.id}>
            {formatAcademicPeriod(t.year, t.kind, t.number) ?? t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
