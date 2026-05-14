import type { HistorialPeriod } from '@/features/mi-carrera/data/historial';

/**
 * KPIs computados sobre el historial. Port literal de los 4 valores que
 * el canvas `V2CarreraHistorial` muestra arriba del timeline:
 *
 *   - materias aprobadas (count)
 *   - promedio general (avg de notas, 1 decimal)
 *   - períodos cursados (count de períodos)
 *   - primer cuatri (label del período más antiguo)
 *
 * Helpers puros. Sin side effects. Testeables aisladamente.
 */

export type HistorialSummary = {
  totalApproved: number;
  overallAverage: string;
  periodsCount: number;
  firstPeriodLabel: string;
};

/** Total de materias con `state === 'aprob'` cross-períodos. */
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
 * Promedio simple de las notas no-null. Devuelve string con 1 decimal,
 * o `"—"` si no hay notas (evita NaN visible).
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

/** Count de períodos cursados. */
export function periodsCount(periods: HistorialPeriod[]): number {
  return periods.length;
}

/**
 * Label legible del primer período cursado (el más antiguo del array,
 * asumiendo orden descendente por defecto del mock).
 *
 * El canvas usa formato `"Mar 2024"` (mes + año). El mock tiene formato
 * `"2024·1c"`. Hacemos un mapping simple: `1c` → `Mar`, `2c` → `Ago`.
 * Si el período no matchea el formato, se muestra raw.
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

/** One-shot helper que arma el `HistorialSummary` completo. */
export function buildSummary(periods: HistorialPeriod[]): HistorialSummary {
  return {
    totalApproved: totalApproved(periods),
    overallAverage: overallAverage(periods),
    periodsCount: periodsCount(periods),
    firstPeriodLabel: firstPeriodLabel(periods),
  };
}
