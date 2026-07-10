import Link from 'next/link';
import { reasonLabel } from '../reasons';
import { timeSince } from '../time';
import type { ReportQueueItem } from '../types';
import { ToneDot } from './tone-dot';

// dot / reporte / motivo / cita / reseña / reportó / hace / decidir
const GRID = '16px 92px minmax(0,1.3fr) minmax(0,2fr) 84px 84px 76px 96px';

/**
 * Tabla de la cola de reportes (US-050). Una fila por report, ordenada por el backend (urgencia +
 * antigüedad). Los ids son guids: se muestra el prefijo en mono (el backend no emite ids mono como el
 * mockup). Densa, tabla sobre card (registro admin del design system, espeja `TeacherTable`).
 */
export function ReportsTable({
  items,
  emptyLabel,
}: {
  items: ReportQueueItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
      <div
        className="grid items-center gap-3 border-b border-line bg-bg-elev px-3.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3"
        style={{ gridTemplateColumns: GRID, height: 32 }}
      >
        <div />
        <div>Reporte</div>
        <div>Motivo</div>
        <div>Cita</div>
        <div>Reseña</div>
        <div>Reportó</div>
        <div className="text-right">Hace</div>
        <div />
      </div>
      {items.map((item) => (
        <ReportRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ReportRow({ item }: { item: ReportQueueItem }) {
  return (
    <div
      className="grid items-center gap-3 border-b border-line-2 px-3.5 py-2 last:border-b-0"
      style={{ gridTemplateColumns: GRID }}
    >
      <ToneDot tone={item.tone} />
      <span className="truncate font-mono text-[11px] text-ink-2">{item.id.slice(0, 8)}</span>
      <span className="truncate text-ink">{reasonLabel(item.reason)}</span>
      <span className="truncate italic text-ink-3">
        {item.snippet ? `"${item.snippet}"` : 'sin cita'}
      </span>
      <span className="truncate font-mono text-[10px] text-ink-4">
        {item.targetReviewId.slice(0, 8)}
      </span>
      <span className="truncate font-mono text-[10px] text-ink-4">
        {item.reporterUserId.slice(0, 8)}
      </span>
      <span className="text-right text-ink-3">{timeSince(item.createdAt)}</span>
      <div className="text-right">
        <Link
          href={`/admin/moderacion/reportes/${item.id}`}
          className="inline-flex h-7 items-center rounded-md border border-line bg-bg px-2.5 text-[11.5px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          Decidir →
        </Link>
      </div>
    </div>
  );
}
