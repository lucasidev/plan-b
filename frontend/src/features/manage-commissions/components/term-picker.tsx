import Link from 'next/link';
import type { AdminTermRow } from '@/features/manage-terms';
import { formatTermKind } from '@/lib/academic-terms';

/**
 * Paso 2 del selector universidad + término de "Comisiones · término" (US-093), una vez elegida la
 * universidad. Son Links puros (sin estado cliente): cada fila navega a `?universityId=&termId=` y la
 * RSC re-fetchea. Orden: el que ya trae `fetchTermsByUniversityServer` (year desc, number desc, los
 * más recientes primero).
 */
export function TermPicker({
  universityId,
  terms,
}: {
  universityId: string;
  terms: AdminTermRow[];
}) {
  if (terms.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          Esta universidad todavía no tiene períodos lectivos cargados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
      {terms.map((t) => (
        <Link
          key={t.id}
          href={`/admin/commissions?universityId=${universityId}&termId=${t.id}`}
          className="flex items-center justify-between border-b border-line-2 px-3.5 py-2.5 text-ink-2 last:border-b-0 hover:bg-bg-elev hover:text-ink"
        >
          <span className="truncate font-mono">{t.label}</span>
          <span className="text-[11px] text-ink-4">{formatTermKind(t.kind)}</span>
        </Link>
      ))}
    </div>
  );
}
