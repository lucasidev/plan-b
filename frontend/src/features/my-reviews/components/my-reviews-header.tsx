import { cn } from '@/lib/utils';
import type { MyReviewsStats } from '../types';

type Props = {
  stats: MyReviewsStats;
};

/**
 * Stats KPI strip rendered above the list (per US-048 AC: "Header con stats: cantidad
 * publicadas, cantidad con respuesta del docente"). Response-from-teacher count is not
 * available yet (US-040 lands later); we show the breakdown of the alumno's own publish
 * states instead, which is honest about what we have.
 */
export function MyReviewsHeader({ stats }: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-3 border border-line rounded-lg p-4',
        'bg-bg-card shadow-card',
      )}
    >
      <Kpi value={stats.publishedCount} label="publicadas" tone="ok" />
      <Kpi value={stats.underReviewCount} label="en revisión" tone="warm" />
      <Kpi value={stats.totalCount} label="total" tone="neutral" />
    </div>
  );
}

function Kpi({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: 'ok' | 'warm' | 'neutral';
}) {
  return (
    <div className="flex flex-col">
      <div
        className={cn(
          'font-mono font-semibold leading-none',
          tone === 'ok' && 'text-st-approved-fg',
          tone === 'warm' && 'text-st-coursing-fg',
          tone === 'neutral' && 'text-ink',
        )}
        style={{ fontSize: 22, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}
