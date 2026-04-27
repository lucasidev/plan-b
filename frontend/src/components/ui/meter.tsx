import { cn } from '@/lib/utils';

type Props = {
  value: number;
  max?: number;
  label: React.ReactNode;
  /** Optional caption shown right-aligned next to the label, e.g. "60%" or "3.4/5". */
  sub?: React.ReactNode;
  /** Bar fill color. Default ink, `warm` is accent, `danger` is failed-state fg. */
  tone?: 'ink' | 'warm' | 'danger';
  className?: string;
};

/**
 * Horizontal progress bar with a mono-font label above. Used for "carga real",
 * "dificultad", "recomendarían", and onboarding parsing progress.
 */
export function Meter({ value, max = 100, label, sub, tone = 'ink', className }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex justify-between font-mono text-[10.5px] text-ink-3 tracking-wide">
        <span>{label}</span>
        {sub && <span className="tabular-nums">{sub}</span>}
      </div>
      <div className="relative h-1.5 bg-line-2 rounded-pill overflow-hidden">
        <i
          className={cn(
            'block h-full rounded-pill',
            tone === 'ink' && 'bg-ink',
            tone === 'warm' && 'bg-accent',
            tone === 'danger' && 'bg-st-failed-fg',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
