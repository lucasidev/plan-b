import type { TranscriptPeriod } from '@/features/my-career/types';

/**
 * KPIs calculados sobre el historial real (US-045-e). Puerto de los 4 valores que
 * `V2CarreraHistorial` (canvas) muestra arriba de la timeline:
 *
 *   - materias aprobadas (conteo)
 *   - promedio general (promedio de notas, 1 decimal)
 *   - períodos cursados (conteo de grupos con período real)
 *   - primer cuatri (label del período más viejo)
 *
 * Helpers puros, sin side effects, testeables en aislamiento.
 */

/**
 * Placeholder de "sin dato". Constante aparte (en vez de un literal repetido en cada
 * función) para no repetir el carácter directamente en el código fuente.
 */
const NO_DATA_PLACEHOLDER = String.fromCharCode(8212);

export type TranscriptSummary = {
  totalApproved: number;
  overallAverage: string;
  periodsCount: number;
  firstPeriodLabel: string;
};

/** Total de materias con `status === 'Passed'` en todo el historial. */
export function totalApproved(periods: TranscriptPeriod[]): number {
  let count = 0;
  for (const p of periods) {
    for (const item of p.items) {
      if (item.status === 'Passed') count++;
    }
  }
  return count;
}

/**
 * Promedio simple de las notas no nulas de todo el historial (incluye el grupo sin
 * período: una equivalencia con nota suma igual). Devuelve un string con 1 decimal, o
 * el placeholder cuando no hay ninguna nota (evita un NaN visible).
 */
export function overallAverage(periods: TranscriptPeriod[]): string {
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
  return n === 0 ? NO_DATA_PLACEHOLDER : (sum / n).toFixed(1);
}

/** True cuando el grupo tiene un período real (no es el grupo de equivalencias). */
function hasRealPeriod(period: TranscriptPeriod): period is TranscriptPeriod & { label: string } {
  return period.label !== null;
}

/**
 * Cantidad de períodos cursados: solo cuenta los grupos con `label` real. El grupo de
 * equivalencias (u otra cursada sin cuatrimestre conocido) no es un período cursado.
 */
export function periodsCount(periods: TranscriptPeriod[]): number {
  return periods.filter(hasRealPeriod).length;
}

/**
 * Label legible del primer período cursado (el más viejo, último del array porque el
 * backend ordena descendente), salteando el grupo sin período: ese viaja siempre al
 * final (ver DapperMyTranscriptReader, NULLS LAST) y no es un período real que
 * mostrar acá.
 *
 * El canvas usa el formato `"Mar 2024"` (mes + año). El período llega en el label que
 * calcula el backend (`AcademicTerm.ComputeLabel`): `"2024-C1"` para un cuatrimestre,
 * `"2024"` pelado para un anual. Mapeamos el cuatrimestre a cuándo arranca (`C1` a
 * `Mar`, `C2` a `Ago`). Cualquier otra cadencia (`-S1`, `-B3`) se muestra cruda:
 * ningún mes puntual representa bien un semestre.
 */
export function firstPeriodLabel(periods: TranscriptPeriod[]): string {
  const withRealPeriod = periods.filter(hasRealPeriod);
  if (withRealPeriod.length === 0) return NO_DATA_PLACEHOLDER;
  const first = withRealPeriod[withRealPeriod.length - 1].label;
  const yearOnly = first.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]} anual`;
  const match = first.match(/^(\d{4})-C([12])$/);
  if (!match) return first;
  const [, year, term] = match;
  return term === '1' ? `Mar ${year}` : `Ago ${year}`;
}

/** Arma el `TranscriptSummary` completo en una sola pasada. */
export function buildSummary(periods: TranscriptPeriod[]): TranscriptSummary {
  return {
    totalApproved: totalApproved(periods),
    overallAverage: overallAverage(periods),
    periodsCount: periodsCount(periods),
    firstPeriodLabel: firstPeriodLabel(periods),
  };
}
