import Link from 'next/link';
import type { AdminTermRow } from '../types';

const GRID = 'minmax(0,1fr) minmax(0,1fr) minmax(0,1.6fr) 96px';

/**
 * Tabla del backoffice de períodos lectivos de una universidad (US-064 admin). Mismo registro
 * visual que CareerTable/UniversityTable (tabla densa, mono para metadatos). A diferencia de esas,
 * no hay toggle de estado (el backend no tiene desactivar/reactivar para AcademicTerm) ni detalle
 * separado: cada fila solo ofrece "Editar". Server component: sin mutaciones no hace falta cliente.
 */
export function TermTable({
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
          Todavía no hay períodos lectivos en esta universidad. Cargá el primero con "Nuevo
          período".
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
      <div
        className="grid items-center gap-3.5 border-b border-line bg-bg-elev px-3.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3"
        style={{ gridTemplateColumns: GRID, height: 32 }}
      >
        <div>Período</div>
        <div>Cadencia</div>
        <div>Inicio a fin</div>
        <div className="text-right">Acciones</div>
      </div>
      {terms.map((t) => (
        <TermRow key={t.id} universityId={universityId} term={t} />
      ))}
    </div>
  );
}

function TermRow({ universityId, term }: { universityId: string; term: AdminTermRow }) {
  return (
    <div className="border-b border-line-2 last:border-b-0">
      <div className="grid items-center gap-3.5 px-3.5 py-2" style={{ gridTemplateColumns: GRID }}>
        <div className="truncate font-mono text-ink">{term.label}</div>
        <div className="truncate text-ink-2">{term.kind}</div>
        <div className="truncate font-mono text-[11px] text-ink-2">
          {formatDateOnly(term.startDate)} a {formatDateOnly(term.endDate)}
        </div>
        <div className="flex items-center justify-end">
          <Link
            href={`/admin/universities/${universityId}/terms/${term.id}/edit`}
            className="rounded-md px-2 py-1 text-[11.5px] text-ink-2 hover:bg-bg-elev hover:text-ink"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * "2026-03-01" (DateOnly del backend) -> "01/03/2026". Split de string, no `Date`: un
 * `new Date("2026-03-01")` ancla a medianoche UTC y en husos horarios negativos (ej. Argentina,
 * UTC-3) se corre un día al formatearlo con hora local.
 */
function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
