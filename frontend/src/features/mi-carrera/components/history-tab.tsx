import Link from 'next/link';
import {
  historial as defaultHistorial,
  type HistorialPeriod,
} from '@/features/mi-carrera/data/historial';
import { buildSummary } from '@/features/mi-carrera/lib/historial-summary';
import { cn } from '@/lib/utils';
import { HistoryKpi } from './history-kpi';
import { HistoryPeriodCard } from './history-period-card';

type Props = {
  /** Override del mock para tests. */
  periods?: HistorialPeriod[];
};

/**
 * Tab "Historial" de Mi carrera (US-045-e). Port literal del mock
 * `canvas-mocks/v2-screens-3.jsx::V2CarreraHistorial`. Layout:
 *
 *   1. 4 KPI cards arriba (grid 4 cols).
 *   2. Banda de acciones: subtitle + 2 botones (Importar PDF + Materia
 *      rendida) navegan a stubs.
 *   3. Timeline vertical de cards por período (más reciente primero).
 *
 * Empty state cuando `periods.length === 0`: copy de bienvenida + ambos
 * CTAs destacados, sin KPIs (no hay data).
 *
 * Server component.
 */
export function HistoryTab({ periods = defaultHistorial }: Props) {
  if (periods.length === 0) {
    return <EmptyState />;
  }

  const summary = buildSummary(periods);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HistoryKpi value={summary.totalApproved} label="materias aprobadas" />
        <HistoryKpi value={summary.overallAverage} label="promedio general" />
        <HistoryKpi value={summary.periodsCount} label="períodos cursados" />
        <HistoryKpi value={summary.firstPeriodLabel} label="primer cuatri" />
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3',
          'pb-3 border-b border-line',
        )}
      >
        <div className="text-xs text-ink-3">
          Lo que cargaste en el onboarding más lo que fuiste sumando después.
        </div>
        <div className="flex gap-2">
          <Link
            href="/mi-carrera/historial/importar"
            className={cn(
              'px-3 py-1.5 text-[12.5px] rounded-md font-medium',
              'bg-bg-card border border-line text-ink-2',
              'hover:border-accent hover:text-ink transition-colors',
            )}
          >
            Importar PDF
          </Link>
          <Link
            href="/mi-carrera/historial/agregar"
            className={cn(
              'px-3 py-1.5 text-[12.5px] rounded-md font-medium',
              'bg-accent text-white hover:bg-accent-hover transition-colors',
            )}
          >
            + Materia rendida
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {periods.map((p) => (
          <HistoryPeriodCard key={p.period} period={p} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className={cn(
        'bg-bg-card border border-line rounded-lg shadow-card',
        'p-10 text-center flex flex-col items-center gap-4',
      )}
    >
      <h2 className="font-display font-semibold text-lg text-ink">Tu historial está vacío.</h2>
      <p className="text-sm text-ink-3 max-w-md">
        Empezá cargando una materia o importando el PDF del SIU. Lo que sumes acá alimenta el resto
        de Mi carrera.
      </p>
      <div className="flex gap-2 mt-2">
        <Link
          href="/mi-carrera/historial/importar"
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium',
            'bg-bg-card border border-line text-ink-2',
            'hover:border-accent hover:text-ink',
          )}
        >
          Importar PDF
        </Link>
        <Link
          href="/mi-carrera/historial/agregar"
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium',
            'bg-accent text-white hover:bg-accent-hover',
          )}
        >
          + Materia rendida
        </Link>
      </div>
    </div>
  );
}
