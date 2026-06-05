import { cn } from '@/lib/utils';

type Props = {
  /** Numeric value or short text rendered big. */
  value: string;
  /** Descriptive label below the value. */
  label: string;
};

/**
 * Stat cell used in "En números" cards inside drawers (US-045-d). Port of the canvas
 * mock's `V2Stat`.
 */
export function StatCell({ value, label }: Props) {
  return (
    <div>
      <div
        className={cn('font-mono font-semibold text-ink leading-none', 'tracking-tight')}
        style={{ fontSize: 22, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}
