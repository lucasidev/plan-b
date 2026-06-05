import { cn } from '@/lib/utils';

type Props = {
  value: number;
  max: number;
  /**
   * `neutral` fills with `--color-ink` (default use).
   * `warm` fills with `--color-accent` (states with visual urgency, e.g. term coming
   * to an end, subjects past 80% of the cursado).
   */
  tone?: 'neutral' | 'warm';
  className?: string;
};

/**
 * Visual bar without labels. Port of the `V2Progress` helper from the mock
 * (`v2-screens.jsx`). Differs from the design system's `Meter` component in that
 * `Meter` requires a label above; this one is used when the labels live elsewhere
 * (e.g. inside 3-column grids like the period card, where the labels sit beside the
 * bar).
 *
 * If `max` is 0 or the value falls out of range, it clamps to 0% / 100% without
 * crashing. `Math.max(0, ...)` and `Math.min(100, ...)` keep the invariants.
 */
export function ProgressBar({ value, max, tone = 'neutral', className }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={cn('relative h-1.5 bg-line-2 rounded-pill overflow-hidden', className)}>
      <i
        className={cn(
          'block h-full rounded-pill',
          tone === 'neutral' && 'bg-ink',
          tone === 'warm' && 'bg-accent',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
