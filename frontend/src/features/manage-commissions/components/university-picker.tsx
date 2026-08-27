import Link from 'next/link';
import type { AdminUniversityRow } from '@/features/manage-universities';

/**
 * Paso 1 del selector universidad + término de "Comisiones · término" (US-093): la oferta es por
 * término, y un término pertenece a una sola universidad, así que sin elegir universidad primero no
 * hay contra qué listar. Son Links puros (sin estado cliente): cada fila navega a
 * `?universityId=` y la RSC re-fetchea.
 */
export function UniversityPicker({ universities }: { universities: AdminUniversityRow[] }) {
  if (universities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">Todavía no hay universidades cargadas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
      {universities.map((u) => (
        <Link
          key={u.id}
          href={`/admin/commissions?universityId=${u.id}`}
          className="flex items-center justify-between border-b border-line-2 px-3.5 py-2.5 text-ink-2 last:border-b-0 hover:bg-bg-elev hover:text-ink"
        >
          <span className="truncate">{u.name}</span>
          <span className="font-mono text-[10px] text-ink-4">{u.careerCount} carreras</span>
        </Link>
      ))}
    </div>
  );
}
