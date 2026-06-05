import { cn } from '@/lib/utils';

type Props = {
  /** Big value (string to support em-dash placeholder or `"Mar 2024"`). */
  value: string | number;
  /** Descriptive label below. */
  label: string;
};

/**
 * Single KPI card for the Historial tab (US-045-e). Literal port of the canvas
 * `V2HistKpi`: big mono number on top, `ink-3` label below.
 */
export function HistoryKpi({ value, label }: Props) {
  return (
    <div className={cn('bg-bg-card border border-line rounded-lg shadow-card', 'p-4')}>
      <div
        className="font-mono font-semibold text-ink leading-none"
        style={{ fontSize: 22, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}
