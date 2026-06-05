/**
 * Snapshot of the student's current academic period. 100% mock in MVP. Once a real
 * academic-calendar module lands (post-MVP), this file swaps its `currentPeriod` for a
 * fetcher against the corresponding endpoint.
 *
 * Structure aligned with the `v2-shell.jsx::V2_PERIOD` mock:
 * `{ year: 2026, weekOfYear: 18, weeksInYear: 32, label: '2026 · en curso' }`.
 *
 * `secondHalfStartWeek` marks the start of the 2nd term (week 17 of the 32-week
 * academic year). `PeriodProgressCard` uses it to label the "2c arranca · sem 17"
 * marker on the progress bar.
 */
export type PeriodSnapshot = {
  year: number;
  /** Current week of the academic year (0 to `weeksInYear`). */
  weekOfYear: number;
  /** Total length of the academic year in weeks (typically 32). */
  weeksInYear: number;
  /** Compact status label: `"2026 · en curso"`, `"2026 · planificado"`, etc. */
  label: string;
  /** Week the 2nd term starts on. Used by the progress bar to mark the split. */
  secondHalfStartWeek: number;
  /** Short label for the academic year start (e.g. `"mar 2026"`). University-specific. */
  startLabel: string;
  /** Short label for the academic year end (e.g. `"nov 2026"`). University-specific. */
  endLabel: string;
};

// TODO: once the academic-calendar module lands, swap this mock for a fetch to
// `GET /api/me/period` (or equivalent). The PeriodSnapshot shape stays the same; only
// the source changes.
export const currentPeriod: PeriodSnapshot = {
  year: 2026,
  weekOfYear: 18,
  weeksInYear: 32,
  label: '2026 · en curso',
  secondHalfStartWeek: 17,
  startLabel: 'mar 2026',
  endLabel: 'nov 2026',
};
