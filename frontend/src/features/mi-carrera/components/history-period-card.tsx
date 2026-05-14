import type { HistorialPeriod } from '@/features/mi-carrera/data/historial';
import { cn } from '@/lib/utils';

/**
 * Card de un período del historial (US-045-e). Port literal del bloque
 * que el canvas renderea para cada `c` del array `V2_HIST`.
 *
 * Header del card: período mono bold + subtitle `"N materias · promedio
 * X.X"`. Body: mini-grid 6 cols con una fila por entrada del período.
 *
 * Server component (sin interacción). El `⋯` action menu es visual
 * placeholder; cuando aterrice US-015 (editar/eliminar), se reemplaza.
 */
export function HistoryPeriodCard({ period }: { period: HistorialPeriod }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg shadow-card p-5">
      <div className="flex justify-between items-baseline mb-2.5">
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-mono font-semibold text-ink"
            style={{ fontSize: 13.5, letterSpacing: '0.02em' }}
          >
            {period.period}
          </span>
          <span className="text-[11.5px] text-ink-3">
            {period.items.length} materias · promedio {period.avg.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '80px 1fr 110px 90px 60px 30px' }}>
        {period.items.map((item, idx) => {
          const aprob = item.state === 'aprob';
          const borderClass = idx === 0 ? '' : 'border-t border-line';
          return (
            <div key={item.code} className="contents">
              <div className={cn('py-2.5 font-mono text-[10.5px] text-ink-3', borderClass)}>
                {item.code}
              </div>
              <div className={cn('py-2.5 text-[13px] font-medium text-ink', borderClass)}>
                {item.name}
              </div>
              <div className={cn('py-2.5 text-[11px] text-ink-3', borderClass)}>
                con {item.teacher}
              </div>
              <div className={cn('py-2.5', borderClass)}>
                <StateChip aprob={aprob} />
              </div>
              <div
                className={cn(
                  'py-2.5 font-mono font-semibold text-right',
                  borderClass,
                  aprob ? 'text-ink' : 'text-ink-3',
                )}
                style={{ fontSize: 14 }}
              >
                {item.grade ?? '—'}
              </div>
              <div
                className={cn('py-2.5 text-right text-ink-3', borderClass)}
                aria-hidden
                title="Acciones disponibles cuando aterrice US-015"
              >
                ⋯
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StateChip({ aprob }: { aprob: boolean }) {
  return (
    <span
      className="font-mono text-[10.5px] inline-flex"
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        letterSpacing: '0.03em',
        background: aprob ? 'oklch(0.94 0.05 145)' : 'oklch(0.93 0.05 50)',
        color: aprob ? 'oklch(0.42 0.09 145)' : 'oklch(0.45 0.13 50)',
      }}
    >
      {aprob ? 'aprob' : 'recurso'}
    </span>
  );
}
