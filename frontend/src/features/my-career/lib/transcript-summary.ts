import type { HistorialPeriod } from '@/features/my-career/data/transcript';

/**
 * KPIs computed over the transcript. Literal port of the 4 values the
 * `V2CarreraHistorial` canvas shows above the timeline:
 *
 *   - approved subjects (count)
 *   - overall average (avg of grades, 1 decimal)
 *   - periods taken (period count)
 *   - first term (label of the oldest period)
 *
 * Pure helpers. No side effects. Testable in isolation.
 */

export type HistorialSummary = {
  totalApproved: number;
  overallAverage: string;
  periodsCount: number;
  firstPeriodLabel: string;
};

/** Total subjects with `state === 'aprob'` across periods. */
export function totalApproved(periods: HistorialPeriod[]): number {
  let count = 0;
  for (const p of periods) {
    for (const item of p.items) {
      if (item.state === 'aprob') count++;
    }
  }
  return count;
}

/**
 * Simple average of the non-null grades. Returns a string with 1 decimal, or the
 * em-dash placeholder when there are no grades (avoids a visible NaN).
 */
export function overallAverage(periods: HistorialPeriod[]): string {
  let sum = 0;
  let n = 0;
  for (const p of periods) {
    for (const item of p.items) {
      if (item.grade != null) {
        sum += item.grade;
        n++;
      }
    }
  }
  return n === 0 ? '—' : (sum / n).toFixed(1);
}

/** Count of periods taken. */
export function periodsCount(periods: HistorialPeriod[]): number {
  return periods.length;
}

/**
 * Readable label of the first period taken (the oldest in the array, assuming the
 * mock's default descending order).
 *
 * The canvas uses the `"Mar 2024"` (month + year) format. The mock uses the
 * `"2024·1c"` format. We do a simple mapping: `1c` to `Mar`, `2c` to `Ago`. If the
 * period does not match the format, it's rendered raw.
 */
export function firstPeriodLabel(periods: HistorialPeriod[]): string {
  if (periods.length === 0) return '—';
  const first = periods[periods.length - 1].period;
  const match = first.match(/^(\d{4})·(1c|2c|anual)$/);
  if (!match) return first;
  const [, year, term] = match;
  if (term === '1c') return `Mar ${year}`;
  if (term === '2c') return `Ago ${year}`;
  return `${year} anual`;
}

/** One-shot helper that assembles the full `HistorialSummary`. */
export function buildSummary(periods: HistorialPeriod[]): HistorialSummary {
  return {
    totalApproved: totalApproved(periods),
    overallAverage: overallAverage(periods),
    periodsCount: periodsCount(periods),
    firstPeriodLabel: firstPeriodLabel(periods),
  };
}
