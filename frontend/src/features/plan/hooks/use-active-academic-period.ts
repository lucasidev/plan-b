'use client';

import { PERIOD_2026_1C, PERIOD_2026_2C, PERIOD_2027_1C } from '../data/mocks';
import type { AcademicPeriod } from '../types';

/**
 * Mock del período académico activo (US-046). Cuando aterrice US-064 (AcademicTerm
 * backoffice) y el calendario académico real exista en backend, este hook se conecta al
 * cliente que consulta los terms vigentes según la universidad del user.
 *
 * Por ahora: heurística sobre `new Date()`: si estamos antes del 1 de julio, es 1c; sino 2c.
 * Cubre el 99% de los casos para la maqueta.
 */
export function useActiveAcademicPeriod(now: Date = new Date()): AcademicPeriod {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 2026 está hardcoded en los mocks de subjects/blocks. Para que el calendario semanal
  // mockeado siga teniendo sentido cuando se vea desde 2027+, devolvemos siempre el 2026·1c
  // como "activo" mientras los mocks estén pegados ahí. Cuando aterrice el backend real, este
  // bloque desaparece y se calcula honestamente.
  if (year >= 2027) {
    return PERIOD_2027_1C;
  }

  if (year === 2026 && (month > 7 || (month === 7 && day > 5))) {
    return PERIOD_2026_2C;
  }

  return PERIOD_2026_1C;
}

/**
 * True cuando la fecha de inicio del período del borrador ya pasó: dispara el nudge "tu
 * borrador empezó hace X días, ¿lo activás?".
 */
export function isDraftStale(draftPeriod: AcademicPeriod, now: Date = new Date()): boolean {
  return new Date(draftPeriod.startsAt) < now;
}

/**
 * Cantidad de días transcurridos desde que arrancó el período del borrador. Negativo si todavía
 * no empezó (no se renderea el nudge en ese caso).
 */
export function daysSinceDraftStart(draftPeriod: AcademicPeriod, now: Date = new Date()): number {
  const start = new Date(draftPeriod.startsAt);
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
