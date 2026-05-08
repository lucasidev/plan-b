/**
 * Snapshot del período académico actual del alumno. Mock 100% en MVP. Cuando
 * aterrice un módulo de calendario académico real (post-MVP), este file
 * reemplaza su `currentPeriod` por un fetcher contra el endpoint correspondiente.
 *
 * Estructura alineada al mock `v2-shell.jsx::V2_PERIOD`:
 * `{ year: 2026, weekOfYear: 18, weeksInYear: 32, label: '2026 · en curso' }`.
 *
 * `secondHalfStartWeek` marca el inicio del 2° cuatri (semana 17 del año
 * académico de 32 semanas). El `PeriodProgressCard` lo usa para etiquetar el
 * marker "2c arranca · sem 17" en el progress bar.
 */
export type PeriodSnapshot = {
  year: number;
  /** Semana actual del año académico (0 a `weeksInYear`). */
  weekOfYear: number;
  /** Duración total del año académico en semanas (típicamente 32). */
  weeksInYear: number;
  /** Label compacto para mostrar el estado: `"2026 · en curso"`, `"2026 · planificado"`, etc. */
  label: string;
  /** Semana en que arranca el 2° cuatri. Usada por el progress bar para marcar el split. */
  secondHalfStartWeek: number;
  /** Label corto para el inicio del año académico (ej. `"mar 2026"`). Específico de la universidad. */
  startLabel: string;
  /** Label corto para el fin del año académico (ej. `"nov 2026"`). Específico de la universidad. */
  endLabel: string;
};

// TODO: cuando aterrice el módulo de calendario académico, reemplazar este
// mock por un fetch a `GET /api/me/period` (o equivalente). El shape del
// PeriodSnapshot se mantiene; solo cambia la fuente.
export const currentPeriod: PeriodSnapshot = {
  year: 2026,
  weekOfYear: 18,
  weeksInYear: 32,
  label: '2026 · en curso',
  secondHalfStartWeek: 17,
  startLabel: 'mar 2026',
  endLabel: 'nov 2026',
};
