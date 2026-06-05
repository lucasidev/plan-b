import Link from 'next/link';
import type { HistorialPeriod } from '@/features/my-career/data/transcript';
import { buildSummary } from '@/features/my-career/lib/transcript-summary';
import { cn } from '@/lib/utils';
import { HistoryKpi } from './history-kpi';
import { HistoryPeriodCard } from './history-period-card';

type Props = {
  /**
   * Real student transcript. Defaults to `[]` (no transcript) → empty state.
   *
   * Once the read lands (GET /api/me/enrollment-records, next sprint), the parent
   * server component will pass the real periods here. Meanwhile tests can inject
   * fixtures via override.
   *
   * **Critical**: do NOT default to the `defaultHistorial` mock (Lucía's data). That
   * caused a cross-user data leak where any new user saw Lucía's full transcript even
   * though they had nothing loaded. Spotted in the 2026-05-16 demo.
   */
  periods?: HistorialPeriod[];
};

/**
 * "Historial" tab of Mi carrera (US-045-e). Literal port of the mock
 * `canvas-mocks/v2-screens-3.jsx::V2CarreraHistorial`. Layout:
 *
 *   1. 4 KPI cards on top (4-col grid).
 *   2. Action band: subtitle + 2 buttons (Importar PDF + Materia rendida) navigate to
 *      their respective flows.
 *   3. Vertical timeline of period cards (most recent first).
 *
 * Empty state when `periods.length === 0`: welcome copy + both CTAs highlighted, no
 * KPIs (no data).
 *
 * Server component.
 */
// Module-scope empty array so the default value does not create a new ref on every
// render (react-doctor/rerender-memo-with-default-value rule). Important because we
// pass `periods` as a dep to other hooks downstream.
const EMPTY_PERIODS: HistorialPeriod[] = [];

export function HistoryTab({ periods = EMPTY_PERIODS }: Props) {
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
            href="/my-career/transcript/import"
            className={cn(
              'px-3 py-1.5 text-[12.5px] rounded-md font-medium',
              'bg-bg-card border border-line text-ink-2',
              'hover:border-accent hover:text-ink transition-colors',
            )}
          >
            Importar PDF
          </Link>
          <Link
            href="/my-career/transcript/add"
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
          href="/my-career/transcript/import"
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium',
            'bg-bg-card border border-line text-ink-2',
            'hover:border-accent hover:text-ink',
          )}
        >
          Importar PDF
        </Link>
        <Link
          href="/my-career/transcript/add"
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
